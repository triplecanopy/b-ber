/* eslint-disable no-continue */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path'
import fs from 'fs-extra'
import uniq from 'lodash/uniq'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import state from './State'
import { safeWrite } from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThemeModule = any

const defaultThemes: Record<string, ThemeModule> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'b-ber-theme-serif': require('@canopycanopycanopy/b-ber-theme-serif'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'b-ber-theme-sans': require('@canopycanopycanopy/b-ber-theme-sans'),
}

// get any themes installed via npm.
const getVendorThemes = (): string[] => {
  const packageJSON = path.resolve('package.json')
  if (!fs.existsSync(packageJSON)) return []

  let themes: string[] = []
  let { dependencies, devDependencies } = fs.readJSONSync(packageJSON) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const deps = dependencies ? Object.keys(dependencies) : []
  const devDeps = devDependencies ? Object.keys(devDependencies) : []

  themes = themes.concat(deps, devDeps)
  themes = themes.filter(name => /^b-ber-theme/.test(name))

  return themes
}

// gets themes from the project/themes dir
const getUserThemes = (): string[] => {
  const dir = path.resolve(state.config.themes_directory as string)

  if (!fs.existsSync(dir)) {
    log.warn(`Themes directory [${path.basename(dir)}] does not exist`)
    return []
  }

  return fs
    .readdirSync(dir)
    .reduce(
      (acc: string[], curr: string) =>
        fs.lstatSync(path.resolve(dir, curr)).isDirectory()
          ? acc.concat(curr)
          : acc,
      []
    )
}

const getThemeList = (themes: string[], current = ''): { text: string; duplicates: string[] } => {
  const themes_ = uniq(themes)
  const duplicates: string[] = []
  const text = themes_
    .reduce((acc: string, curr: string) => {
      let curr_ = `${current === curr ? '✓' : '○'} ${curr}`
      if (themes.indexOf(curr) !== themes.lastIndexOf(curr)) {
        duplicates.push(curr)
        curr_ += ' [(duplicate)]'
      }
      curr_ += '\n'
      return acc.concat(curr_)
    }, '')
    .slice(0, -1) // remove trailing newline

  return { text, duplicates }
}

const getThemes = (): { current: string; themes: string[] } => {
  const current = state.config.theme ? (state.config.theme as string) : ''
  const userThemes = getUserThemes()
  const vendorThemes = getVendorThemes()
  const themes = [...Object.keys(defaultThemes), ...userThemes, ...vendorThemes]

  return { current, themes }
}

const createProjectThemeDirectory = (name: string): Promise<unknown> =>
  fs
    .mkdirp(path.resolve(state.config.src as string, '_stylesheets', name))
    .catch(log.error)

const copyThemeAssets = (theme: ThemeModule): Promise<unknown> => {
  const themePath = path.dirname(theme.entry)
  const themeSettings = path.join(themePath, '_settings.scss')
  const settingsPath = path.resolve(
    state.src.stylesheets(theme.name, '_settings.scss')
  )
  const overridesPath = path.resolve(
    state.src.stylesheets(theme.name, '_overrides.scss')
  )
  const fontsPath = path.resolve(state.src.fonts())
  const imagesPath = path.resolve(state.src.images())

  return fs
    .copy(themeSettings, settingsPath, { overwrite: false })
    .then(() => safeWrite(overridesPath, ''))
    .then(() => {
      if (!theme.fonts.length) return
      const promises = theme.fonts.map((font: string) => {
        const fontPath = path.join(themePath, 'fonts', font)
        return fs.copy(fontPath, path.join(fontsPath, font), {
          overwrite: false,
        })
      })
      return Promise.all(promises)
    })
    .then(() => {
      if (!theme.images.length) return
      const promises = theme.images.map((image: string) => {
        const imagePath = path.join(themePath, 'images', image)
        return fs.copy(imagePath, path.join(imagesPath, image), {
          overwrite: false,
        })
      })
      return Promise.all(promises)
    })
}

const updateConfig = (name: string): Promise<void> => {
  const configPath = path.resolve('config.yml')
  const config = YamlAdaptor.load(configPath) as Record<string, unknown>

  config.theme = name

  const config_ = YamlAdaptor.dump(config)
  return fs.writeFile(configPath, config_)
}

class Theme {
  static list = (): void => {
    const { current, themes } = getThemes()
    const { text, duplicates } = getThemeList(themes, current)

    log.notice('The following themes are available:', '\n', text)
    if (duplicates.length) {
      log.notice(
        'Duplicate themes have been found in both the [node_modules] and [themes] directory'
      )
      log.notice(
        'Resolve this issue by either removing the duplicate directory from [themes] or by running [npm rm <location> <package>]'
      )
    }
  }

  static set = (name: string, force = false): Promise<unknown> => {
    let theme: ThemeModule

    const cwd = process.cwd()
    const cwdArr = cwd.split('/')
    const modulePaths = new Set([...module.paths])

    let cwdPath: string

    // Add modules paths that reference the current b-ber project
    do {
      cwdPath = `${cwdArr.join('/')}/node_modules`
      if (modulePaths.has(cwdPath)) continue

      module.paths.push(cwdPath)
    } while (cwdArr.pop())

    if (defaultThemes[name]) {
      theme = defaultThemes[name]
    } else {
      try {
        theme = require(name)
      } catch (err) {
        log.error(`Could not load theme [${name}]`)
      }
    }

    return createProjectThemeDirectory(name)
      .then(() => copyThemeAssets(theme))
      .then(() => updateConfig(name))
      .then(() => !force && log.notice(`Updated theme [${name}]`))
      .catch(log.error)
  }
}

export default Theme
