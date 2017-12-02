/* eslint-disable global-require, import/no-dynamic-require */
import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import Yaml from 'bber-lib/yaml'
import { forOf } from 'bber-utils'
import store from 'bber-lib/store'
import themes from 'b-ber-themes'

function getUserDefinedThemes() {
    return new Promise(resolve => {
        const { config } = store
        const cwd = process.cwd()

        const names = []
        const userThemes = {}

        if (!{}.hasOwnProperty.call(config, 'themes_directory')) { resolve({ names, themes: userThemes }) }

        fs.readdirSync(path.join(cwd, config.themes_directory)).forEach((_) => {
            const modulePath = path.resolve(cwd, config.themes_directory, _)

            if (!fs.lstatSync(modulePath).isDirectory()) { return }

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
            const userModule =
                fs.existsSync(path.join(modulePath, 'package.json'))
                    ? require(path.join(modulePath))
                    : require(path.join(modulePath, 'index.js'))


            const moduleName = userModule.name
            names.push(moduleName)
            userThemes[moduleName] = userModule
        })

        resolve({ names, themes: userThemes })

    })
}

const printThemeList = (themeList, currentTheme = '') =>
    themeList.reduce((acc, curr) => {
        const icon = currentTheme && currentTheme === curr ? '✔' : '-'
        return acc.concat(`  ${icon} ${curr}\n`)
    }, '')


function setTheme(themeName, themeList, userThemes, cwd) {
    return new Promise(resolve => {
        if (themeList.indexOf(themeName) < 0) {
            console.error(`Could not find theme matching [${themeName}].`)
            console.log('Select one from the list of available themes:')
            console.log(printThemeList(themeList))
            return
        }

        const configPath = path.join(cwd, 'config.yml')
        const configObj  = Yaml.load(configPath)
        const promises   = []

        // save the new theme name to the config.yml
        configObj.theme = themeName

        // write the updated config file
        promises.push(new Promise(resolve =>
            fs.writeFile(configPath, Yaml.dump(configObj), (err) => {
                if (err) { throw err }
                console.log()
                console.log(`Successfully set theme theme to [${themeName}]`)
                console.log()
                return resolve()
            }))
        )

        // add a theme dir with the same name to the src dir, copy over
        // the `settings` file, and create an overrides file
        promises.push(new Promise((resolve) => {
            const themeObject =
                {}.hasOwnProperty.call(themes, themeName)
                    ? themes[themeName]
                    : userThemes.themes[themeName]

            const settingsFileName    = '_settings.scss'
            const overridesFileName   = '_overrides.scss'
            const settingsOutputPath  = path.join(cwd, configObj.src || '_project', '_stylesheets', themeName)
            const settingsInputFile   = path.join(path.dirname(themeObject.entry), settingsFileName)
            const settingsOutputFile  = path.join(settingsOutputPath, settingsFileName)
            const overridesOutputFile = path.join(settingsOutputPath, overridesFileName)


            try {
                if (!fs.existsSync(settingsOutputPath)) {
                    fs.mkdirsSync(settingsOutputPath)
                }
            } catch (err) {
                console.error(err)
                process.exit(1)
            }

            try {
                if (fs.existsSync(settingsOutputFile)) {
                    throw new Error(`b-ber-lib/theme: [${settingsOutputFile}] already exists`)
                } else {
                    fs.copySync(settingsInputFile, settingsOutputFile, {})
                    console.log(`Created [${settingsOutputFile}]`)
                }
                if (fs.existsSync(overridesOutputFile)) {
                    throw new Error(`b-ber-lib/theme: [${overridesOutputFile}] already exists`)
                } else {
                    fs.writeFileSync(overridesOutputFile, '')
                }
            } catch (err) {
                if (/b-ber-lib/.test(err.message)) {
                    console.log(err.message)
                } else {
                    console.error(err)
                }
            }

            resolve()

        }))


        return Promise.all(promises).then(resolve)
    })
}

const theme = () =>
    new Promise(async (resolve) => {


        const cwd = process.cwd()
        const { config } = store
        const themeList = []

        forOf(themes, _ => themeList.push(_))

        // get user themes dir, if any, and merge with built-in b-ber themes
        const userThemes = await getUserDefinedThemes()
        for (let i = 0; i < userThemes.names.length; i++) {
            themeList.push(userThemes.names[i])
        }

        const currentTheme = config.theme || ''

        if (yargs.argv.list) {
            console.log()
            console.log('The following themes are available:')
            console.log(printThemeList(themeList, currentTheme))
            return resolve()
        }


        if (yargs.argv.set) {
            const themeName = yargs.argv.set
            return setTheme(themeName, themeList, userThemes, cwd).then(resolve)
        }

        return resolve(yargs.showHelp())

    })

export { theme, setTheme }
