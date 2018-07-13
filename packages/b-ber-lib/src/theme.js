/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path'
import fs from 'fs-extra'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import {forOf} from './utils'
import state from './State'

function getUserDefinedThemes() {
    return new Promise(resolve => {
        const {config} = state
        const cwd = process.cwd()

        const names = []
        const userThemes = {}

        if (!{}.hasOwnProperty.call(config, 'themes_directory')) resolve({names, themes: userThemes})


        try {
            if (!fs.existsSync(path.join(process.cwd(), config.themes_directory))) {
                throw new Error(`Themes directory [${config.themes_directory}] does not exist.`)
            }
        } catch (err) {
            log.warn(err)
            return resolve({names, themes: userThemes})
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
            const userModule =
                fs.existsSync(path.join(modulePath, 'package.json'))
                    ? require(path.join(modulePath))
                    : require(path.join(modulePath, 'index.js'))


            const moduleName = userModule.name
            names.push(moduleName)
            userThemes[moduleName] = userModule
        })

        resolve({names, themes: userThemes})

    })
}

const printThemeList = (themeList, currentTheme = '') =>
    themeList.reduce((acc, curr) => { // eslint-disable-line prefer-template
        const icon = currentTheme && currentTheme === curr ? '✓' : '○'
        return acc.concat(`  ${icon} ${curr}\n`)
    }, '\n').slice(0, -1) + '\n'


const theme = args =>
    new Promise(async resolve => {

        const {config} = state
        const themeList = []

        forOf(themes, a => themeList.push(a))

        // get user themes dir, if any, and merge with built-in b-ber themes
        const userThemes = await getUserDefinedThemes()

        for (let i = 0; i < userThemes.names.length; i++) {
            themeList.push(userThemes.names[i])
        }

        const currentTheme = config.theme && config.theme ? config.theme : ''
        if (args.list) {
            log.notice('The following themes are available:')
            console.log(printThemeList(themeList, currentTheme))
            return resolve()
        }
    })

export {theme} // eslint-disable-line import/prefer-default-export
