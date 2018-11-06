/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path'
import fs from 'fs-extra'
import find from 'lodash/find'
import defaultThemes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import state from './State'

const getUserDefinedThemes = () => {
    const { config } = state
    const cwd = process.cwd()

    const names = []
    const themes = {}

    if (!config.themes_directory) return { names, themes }

    try {
        if (!fs.existsSync(path.join(process.cwd(), config.themes_directory))) {
            throw new Error(
                `Themes directory [${config.themes_directory}] does not exist.`
            )
        }
    } catch (err) {
        log.warn(err)
        return { names, themes }
    }

    fs.readdirSync(path.join(cwd, config.themes_directory)).forEach(a => {
        const modulePath = path.resolve(cwd, config.themes_directory, a)

        if (!fs.lstatSync(modulePath).isDirectory()) return

        // `entryPoint` here is either a package.json file, or an index.js script that exports the theme object
        // theme object schema:
        //
        // {
        //      name: String        required
        //      entry: String       required
        //      fonts: Array        required
        //      images: Array       required
        //      npmPackage: Object  optional
        // }
        //
        const userModule = fs.existsSync(path.join(modulePath, 'package.json'))
            ? require(path.join(modulePath))
            : require(path.join(modulePath, 'index.js'))

        const moduleName = userModule.name
        names.push(moduleName)
        themes[moduleName] = userModule
    })

    return { names, themes }
}

const printThemeList = (themes, current = '') =>
    `${themes
        .reduce((acc, curr) => {
            const icon = current && current === curr.name ? '✓' : '○'
            return acc.concat(`  ${icon} ${curr.name}\n`)
        }, '\n')
        .slice(0, -1)}\n`

const getThemes = () => {
    const { config } = state
    const themes = []
    const current = config.theme && config.theme ? config.theme : ''
    const userThemes = getUserDefinedThemes().themes

    Object.keys(defaultThemes).forEach(a => themes.push(defaultThemes[a]))
    Object.keys(userThemes).forEach(a => themes.push(userThemes[a]))

    return { current, themes }
}

const createProjectThemeDirectory = name => {
    const { src } = state.config
    return fs
        .mkdirp(path.join(process.cwd(), src, '_stylesheets', name))
        .catch(log.error)
}

const safeCopy = (data, dest) => {
    try {
        if (fs.existsSync(dest)) {
            throw new Error('EEXIST')
        }
    } catch (err) {
        if (err.message === 'EEXIST') return Promise.resolve()
    }

    return fs.copy(data, dest)
}

const safeWrite = (dest, data) => {
    try {
        if (fs.existsSync(dest)) {
            throw new Error('EEXIST')
        }
    } catch (err) {
        if (err.message === 'EEXIST') return Promise.resolve()
    }

    return fs.writeFile(dest, data)
}

const copyThemeAssets = theme => {
    const { src } = state.config
    const themePath = path.dirname(theme.entry)
    const themeSettings = path.join(themePath, '_settings.scss')
    const settingsPath = path.join(
        process.cwd(),
        src,
        '_stylesheets',
        theme.name,
        '_settings.scss'
    )
    const overridesPath = path.join(
        process.cwd(),
        src,
        '_stylesheets',
        theme.name,
        '_overrides.scss'
    )
    const fontsPath = path.join(process.cwd(), src, '_fonts')
    const imagesPath = path.join(process.cwd(), src, '_images')
    return safeCopy(themeSettings, settingsPath)
        .then(safeWrite(overridesPath, ''))
        .then(() => {
            if (!theme.fonts.length) return Promise.resolve()
            const promises = theme.fonts.map(a =>
                safeCopy(a, path.join(fontsPath, path.basename(a)))
            )
            return Promise.all(promises)
        })
        .then(() => {
            if (!theme.images.length) return Promise.resolve()
            const promises = theme.images.map(a =>
                safeCopy(
                    path.join(themePath, 'images', a),
                    path.join(imagesPath, a)
                )
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

        log.notice('The following themes are available:')
        console.log(printThemeList(themes, current))
    }

    static set = async (name, force = false) => {
        const { current, themes } = getThemes()
        const theme = find(themes, { name })

        if (!theme) return log.notice('Could not find theme', name)

        if (current === name && force !== true) {
            return log.notice('Current theme is already', name)
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
