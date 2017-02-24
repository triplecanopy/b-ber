
// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import fs from 'fs-extra'
import path from 'path'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import { log } from '../log'
import { src, dist, env, build, theme } from '../utils'

let input, output, destdir, outputStyle, autoprefixerOptions, outputdir,
    options, buildVars, includePaths, themeName, themePath

async function initialize() {
  const { tpath, tname } = theme()

  themeName = tname
  themePath = tpath

  input = src()
  output = dist()

  destdir = path.join(output, '/OPS/stylesheets')
  outputStyle = env() === 'production' ? 'compressed' : 'nested'
  autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }
  buildVars = `$build: "${build()}";`
  includePaths = [path.join(input, '_stylesheets/'), themePath]

  outputdir = await createdir() // eslint-disable-line no-use-before-define
  options = await sassOptions() // eslint-disable-line no-use-before-define
}

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const stylesheet = () =>
  new Promise((resolve/* , reject */) => {
    try {
      const customSCSS = path.join(input, '_stylesheets/application.scss')
      if (fs.statSync(customSCSS)) {
        return fs.readFile(customSCSS, (err, buffer) => {
          if (err) { throw err }
          log.info('Using SCSS overrides from `_stylesheets/application.scss`.')
          return resolve(buffer)
        })
      }
    }
    catch (err) {
      log.info(`Attempting to build with \`${themeName}\` theme.`)
    }

    const themeSCSS = path.join(themePath, 'application.scss')
    try {
      if (fs.statSync(themeSCSS)) {
        return fs.readFile(themeSCSS, (err, buffer) => {
          if (err) { throw err }
          log.info(`Using theme \`${themeName}\`.`)
          return resolve(buffer)
        })
      }
    }
    catch (err) {
      log.info(`Could not find theme \`${themeName}\`. Make sure the theme exists and contains a valid \`application.scss\`.`) // eslint-disable-line max-len
      return resolve('')
    }

    return resolve(false)
  })

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
  await initialize()
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
