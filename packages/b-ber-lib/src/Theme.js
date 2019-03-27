/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path'
import fs from 'fs-extra'
import defaultThemes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import state from './State'
import { safeCopy, safeWrite } from './utils'

const getVendorThemes = () => {
    const packageJSON = path.join(process.cwd(), 'package.json')
    const themes = []

    try {
        if (!fs.existsSync(packageJSON)) {
            throw new Error(`Project has no packaged themes`)
        }
    } catch (err) {
        log.warn(err)
        return themes
    }

    const pkg = fs.readJSONSync(packageJSON)

    if (pkg.dependencies) {
        themes.push(...Object.keys(pkg.dependencies))
    }

    if (pkg.devDependencies) {
        themes.push(...Object.keys(pkg.devDependencies))
    }

    return themes
}

const getUserThemes = () => {
    const { config } = state
    const cwd = process.cwd()
    const themes = []

    try {
        if (!fs.existsSync(path.join(cwd, config.themes_directory))) {
            throw new Error(`Themes directory [${config.themes_directory}] does not exist`)
        }
    } catch (err) {
        log.warn(err)
        return themes
    }

    fs.readdirSync(path.join(cwd, config.themes_directory)).forEach(a => {
        if (fs.lstatSync(path.resolve(cwd, config.themes_directory, a)).isDirectory()) {
            themes.push(a)
        }
    })

    return themes
}

const printThemeList = (themes, current = '') =>
    `${themes
        .reduce((acc, curr) => acc.concat(`  ${current && current === curr ? '✓' : '○'} ${curr}\n`), '\n')
        .slice(0, -1)}\n`

const getThemes = () => {
    const current = state.config.theme ? state.config.theme : ''
    const userThemes = getUserThemes()
    const vendorThemes = getVendorThemes()
    const themes = [...Object.keys(defaultThemes), ...userThemes, ...vendorThemes]

    return { current, themes }
}

const createProjectThemeDirectory = name => {
    const { src } = state.config
    return fs.mkdirp(path.join(process.cwd(), src, '_stylesheets', name)).catch(log.error)
}

const copyThemeAssets = theme => {
    const { src } = state.config
    const cwd = process.cwd()

    const themePath = path.dirname(theme.entry)
    const themeSettings = path.join(themePath, '_settings.scss')
    const settingsPath = path.join(cwd, src, '_stylesheets', theme.name, '_settings.scss')
    const overridesPath = path.join(cwd, src, '_stylesheets', theme.name, '_overrides.scss')
    const fontsPath = path.join(cwd, src, '_fonts')
    const imagesPath = path.join(cwd, src, '_images')

    return safeCopy(themeSettings, settingsPath)
        .then(safeWrite(overridesPath, ''))
        .then(() => {
            if (!theme.fonts.length) return Promise.resolve()
            const promises = theme.fonts.map(a => safeCopy(path.join(themePath, 'fonts', a), path.join(fontsPath, a)))
            return Promise.all(promises)
        })
        .then(() => {
            if (!theme.images.length) return Promise.resolve()
            const promises = theme.images.map(a =>
                safeCopy(path.join(themePath, 'images', a), path.join(imagesPath, a)),
            )
            return Promise.all(promises)
        })
        .catch(log.error)
}

const updateConfig = name => {
    const configPath = path.join(process.cwd(), 'config.yml')
    const config = YamlAdaptor.load(configPath)

    config.theme = name

    const config_ = YamlAdaptor.dump(config)
    return fs.writeFile(configPath, config_)
}

class Theme {
    static list = () => {
        const { current, themes } = getThemes()

        log.notice('The following themes are available:', '\n', printThemeList(themes, current))
    }

    static set = (name, force = false) => {
        const { themes } = getThemes()
        const cwd = process.cwd()

        let theme

        if (defaultThemes[name]) {
            theme = defaultThemes[name]
        } else {
            try {
                const userPath = path.join(cwd, state.config.themes_directory, name)
                const vendorPath = path.join(cwd, 'node_modules', name)
                const themePath = fs.existsSync(userPath) ? userPath : fs.existsSync(vendorPath) ? vendorPath : null

                if (themes.indexOf(name) < 0 || !themePath) {
                    throw new Error(`Theme [${name}] is not installed`)
                }

                theme = require(themePath)
            } catch (err) {
                return log.error(err)
            }
        }

        return createProjectThemeDirectory(name)
            .then(() => copyThemeAssets(theme))
            .then(() => updateConfig(name))
            .then(() => {
                if (force !== true) log.notice('Updated theme to', name)
                return Promise.resolve()
            })
            .catch(log.error)
    }
}

export default Theme
