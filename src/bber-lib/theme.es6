import Promise from 'zousan'

import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import Yaml from 'bber-lib/yaml'
import { log } from 'bber-plugins'
import { src, forOf } from 'bber-utils'

import store from 'bber-lib/store'
import themes from 'b-ber-themes'

const theme = () =>
    new Promise((resolve, reject) => {

        const { config } = store


        console.log(themes)
        process.exit(0)

        const themeList = []
        forOf(themes, _ => themeList.push(_))

        // get user themes dir, if any, and merge with built-in b-ber themes
        if ({}.hasOwnProperty.call(config, 'user_themes_directory')) {
            forEach(config.user_themes_directory, _ => themeList.push(_))
        }

        const currentTheme = config.theme || ''

        if (yargs.argv.list) {

            console.log()
            console.log('The following themes are available:')

            console.log(themeList.reduce((acc, curr) => {
                const icon = currentTheme === curr ? '✔' : '-'
                return acc.concat(`  ${icon} ${curr}\n`)
            }, ''))


            return resolve()

        }


        if (yargs.argv.set) {
            const themeName = yargs.argv.set

            if (themeList.indexOf(themeName) < 0) {
                return log.error(`Could not find ${themeDir}.`)
            }

            const configPath = path.join(process.cwd(), 'config.yml')
            const configObj = Yaml.load(configPath)

            configObj.theme = themeName

            return fs.writeFile(configPath, Yaml.dump(configObj), (err) => {
                if (err) { throw err }
                log.info(`\nSuccessfully set theme theme to "${themeName}"\n`)
                return resolve()
            })

        }

        return resolve(yargs.showHelp())

    })

export default theme
