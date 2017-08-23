import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import Yaml from 'bber-lib/yaml'
import { log } from 'bber-plugins'
import { theme, src } from 'bber-utils'

const __theme = () =>
  new Promise((resolve, reject) => {
    const themesRoot = theme().root
    const themeCurrent = theme().name || ''

    try {
      fs.existsSync(themesRoot)
    } catch (err) {
      log.info('Creating themes directory')
      fs.mkdir(themesRoot)
    }

    if (yargs.argv.list) {
      return fs.readdir(themesRoot, (err, themes) => {
        if (err) { throw err }
        if (themes.length < 1) { return log.info('No themes currently available') }

        const themeList = themes.reduce((acc, curr) => {
          if (curr.charAt(0) === '.') { return acc }
          const icon = themeCurrent === curr ? '✔ ' : '- '
          return acc.concat(`${icon} ${curr}\n`)
        }, '')


        console.log()
        console.log('The following themes are available:')
        console.log(themeList)

        // log.info(`\nThe following themes are available:\n${themeList}\n`)

        return resolve()
      })
    }

    if (yargs.argv.set) {
      const themeName = yargs.argv.set
      const themeDir = path.resolve(themesRoot, themeName)

      try {
        fs.existsSync(themeDir)
      } catch (err) {
        return log.error(`Could not find ${themeDir}.`)
      }

      const configPath = path.join(process.cwd(), 'config.yml')
      const config = Yaml.load(configPath)

      config.theme = themeName

      return fs.writeFile(configPath, Yaml.dump(config), (err) => {
        if (err) { throw err }
        log.info(`\nSuccessfully set theme theme to "${themeName}"\n`)
        return resolve()
      })

    }

    return resolve(yargs.showHelp())
  })

export default __theme
