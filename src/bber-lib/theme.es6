
import Promise from 'vendor/Zousan'
import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import YAML from 'yamljs'
import { log } from 'bber-plugins'

const cwd = process.cwd()
const themesDir = path.join(cwd, 'themes')

const theme = () =>
  new Promise((resolve, reject) => {
    try {
      fs.existsSync(themesDir)
    } catch (err) {
      log.info('Creating themes directory')
      fs.mkdir(themesDir)
    }

    if (yargs.argv.list) {
      return fs.readdir(themesDir, (err, themes) => {
        if (err) { throw err }
        if (themes.length < 1) { return log.info('No themes currently available') }
        const themeList = themes.filter(_ => _.charAt(0) !== '.').map(_ => `- ${_}`).join('\n')
        log.info(`\nThe following themes are available:\n${themeList}\n`)
        return resolve()
      })
    }

    if (yargs.argv.set) {
      const themeName = yargs.argv.set
      const themeDir = path.resolve(cwd, themesDir, themeName)

      try {
        fs.existsSync(themeDir)
      } catch (err) {
        return log.error(`Could not find ${themeDir}.`)
      }

      const configPath = path.join(cwd, 'config.yml')
      const config = YAML.load(configPath)
      config.theme = themeName
      return fs.writeFile(configPath, YAML.stringify(config, Infinity, 2), (err) => {
        if (err) { throw err }
        log.info(`\nSuccessfully set theme theme to "${themeName}"\n`)
        resolve()
      })
    }

    return reject(yargs.showHelp())
  })

export default theme
