/* eslint-disable no-continue */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path'
import fs from 'fs-extra'
import { uniq } from 'lodash'
import themeSerif from '@canopycanopycanopy/b-ber-theme-serif'
import themeSans from '@canopycanopycanopy/b-ber-theme-sans'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import state from './State'
import { safeWrite } from './utils'

const defaultThemes = {
  'b-ber-theme-serif': themeSerif,
  'b-ber-theme-sans': themeSans,
}

// get any themes installed via npm.
const getVendorThemes = () => {
  const packageJSON = path.resolve('package.json')
  if (!fs.existsSync(packageJSON)) return []

  let themes = []
  let { dependencies, devDependencies } = fs.readJSONSync(packageJSON)
  dependencies = dependencies ? Object.keys(dependencies) : []
  devDependencies = devDependencies ? Object.keys(devDependencies) : []

  themes = themes.concat(dependencies, devDependencies)
  themes = themes.filter(name => /^b-ber-theme/.test(name))

  return themes
}

// gets themes from the project/themes dir
const getUserThemes = () => {
  const dir = path.resolve(state.config.themes_directory)

  if (!fs.existsSync(dir)) {
    log.warn(`Themes directory [${path.basename(dir)}] does not exist`)
    return []
  }

  return fs
    .readdirSync(dir)
    .reduce(
      (acc, curr) =>
        fs.lstatSync(path.resolve(dir, curr)).isDirectory()
          ? acc.concat(curr)
          : acc,
      []
    )
}

const getThemeList = (themes, current = '') => {
  const themes_ = uniq(themes)
  const duplicates = []
  const text = themes_
    .reduce((acc, curr) => {
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

const getThemes = () => {
  const current = state.config.theme ? state.config.theme : ''
  const userThemes = getUserThemes()
  const vendorThemes = getVendorThemes()
  const themes = [...Object.keys(defaultThemes), ...userThemes, ...vendorThemes]

  return { current, themes }
}

const createProjectThemeDirectory = name =>
  fs
    .mkdirp(path.resolve(state.config.src, '_stylesheets', name))
    .catch(log.error)

const copyThemeAssets = theme => {
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
    .then(safeWrite(overridesPath, ''))
    .then(() => {
      if (!theme.fonts.length) return
      const promises = theme.fonts.map(font => {
        const fontPath = path.join(themePath, 'fonts', font)
        return fs.copy(fontPath, path.join(fontsPath, font), {
          overwrite: false,
        })
      })
      return Promise.all(promises)
    })
    .then(() => {
      if (!theme.images.length) return
      const promises = theme.images.map(image => {
        const imagePath = path.join(themePath, 'images', image)
        return fs.copy(imagePath, path.join(imagesPath, image), {
          overwrite: false,
        })
      })
      return Promise.all(promises)
    })
}

const updateConfig = name => {
  const configPath = path.resolve('config.yml')
  const config = YamlAdaptor.load(configPath)

  config.theme = name

  const config_ = YamlAdaptor.dump(config)
  return fs.writeFile(configPath, config_)
}

class Theme {
  static list = () => {
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

  static set = (name, force = false) => {
    let theme

    const cwd = process.cwd()
    const cwdArr = cwd.split('/')
    const modulePaths = new Set([...module.paths])

    let cwdPath

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
