
// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import fs from 'fs-extra'
import path from 'path'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import YAML from 'yamljs'
import conf from './config'
import { log } from './log'

const cwd = process.cwd()
const destdir = path.join(cwd, conf.dist, '/OPS/stylesheets')
const outputStyle = conf.env === 'production' ? 'compressed' : 'nested'
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const stylesheet = () =>
  new Promise((resolve/* , reject */) => {
    try {
      const customSCSS = path.join(cwd, conf.src, '_stylesheets/application.scss')
      if (fs.statSync(customSCSS)) {
        return fs.readFile(customSCSS, (err, buffer) => {
          if (err) { throw err }
          return resolve(buffer)
        })
      }
    }
    catch (err) {
      log.info('Couldn\'t find SCSS override, defaulting to theme styles.')
    }

    try {
      const configPath = path.join(cwd, 'config.yml')
      if (fs.statSync(configPath)) {
        const themeName = YAML.load(configPath).theme
        const themeSCSS = path.join(cwd, 'themes', themeName, 'application.scss')

        try {
          if (fs.statSync(themeSCSS)) {
            return fs.readFile(themeSCSS, (err, buffer) => {
              if (err) { throw err }
              return resolve(buffer)
            })
          }
        }
        catch (err) {
          log.info(`Could not find theme \`${themeName}\`, make sure the theme exists and contains a valid \`application.scss\`.`) // eslint-disable-line max-len
          return resolve('')
        }

      }
    }
    catch (err) {
      log.warn('config.yml does not exist. Re-initialize bber or create the file manually.')
      return resolve(false)
    }

    return resolve(false)
  })


// TODO: build env from config should be passed in through yargs
const build = conf.build || 'epub'
const buildVars = `$build: "${build}";`
const includePaths = [path.join(cwd, conf.src, '_stylesheets/')]

const sassOptions = () =>
  new Promise(async (resolve, reject) => {
    const styles = await stylesheet()
    if (styles === false) { return reject('An error occurred loading the SCSS.') }
    const data = `${buildVars}\n${styles.toString()}`
    return resolve({ data, includePaths, outputStyle, errLogToConsole: true })
  })

const createdir = () =>
  new Promise((resolve, reject) =>
    fs.mkdirs(destdir, (err) => {
      if (err) { reject(err) }
      resolve(destdir)
    })
  )

async function sass() {
  const outputdir = await createdir()
  const options = await sassOptions()
  return new Promise((resolve, reject) => {
    nsass.render(options, (err1, result) => {
      if (err1) { return reject(err1) }
      if (!result) { return reject('Sass: `result` cannot be null.') }
      return postcss(autoprefixer(autoprefixerOptions))
        .process(result.css)
        .then(prefixed =>
          fs.writeFile(path.join(outputdir, 'application.css'), prefixed, (err2) => {
            if (err2) { reject(err2) }
            resolve()
          })
        )
    })
  })
}

export default sass
