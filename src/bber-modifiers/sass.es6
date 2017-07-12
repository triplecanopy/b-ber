
/**
 * @module sass
 */

// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import { log } from 'bber-plugins'
import { src, dist, env, build, theme } from 'bber-utils'

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const createScssString = () =>
  new Promise((resolve) => {
    const chunks = []
    const variableOverridesPath = path.join(src(), '_stylesheets/variable-overrides.scss')
    const styleOverridesPath = path.join(src(), '_stylesheets/style-overrides.scss')
    const themeStylesPath = path.join(theme().tpath, 'application.scss')

    try {
      if (fs.existsSync(variableOverridesPath)) {
        const variableOverrides = fs.readFileSync(variableOverridesPath)
        chunks.push(variableOverrides)
      }
    } catch (err) {
      log.info(`Attempting to build with [${theme().tname}] theme`)
    }

    try {
      if (fs.existsSync(themeStylesPath)) {
        const themeStyles = fs.readFileSync(themeStylesPath)
        chunks.push(themeStyles)
      }
    } catch (err) {
      return log.error(`
        Could not find theme [${theme().tname}].
        Make sure the theme exists and contains a valid [application.scss]`)
    }

    try {
      if (fs.existsSync(styleOverridesPath)) {
        const styleOverrides = fs.readFileSync(styleOverridesPath)
        chunks.push(styleOverrides)
      }
    } catch (err) {
      log.info(`Attempting to build with [${theme().tname}] theme`)
    }


    if (chunks.length < 1) {
      throw new Error('Something went wrong compiling the SCSS.')
    }

    resolve(Buffer.concat(chunks))
  })

const ensureCssDir = () =>
  new Promise(resolve =>
    fs.mkdirp(path.join(dist(), '/OPS/stylesheets'), (err) => {
      if (err) { throw err }
      resolve()
    })
  )

const renderCss = scssString =>
  new Promise(resolve =>
    nsass.render({
      data: `$build: "${build()}";${scssString}`,
      includePaths: [path.join(src(), '_stylesheets/'), theme().tpath],
      outputStyle: env() === 'production' ? 'compressed' : 'nested',
      errLogToConsole: true,
    }, (err, result) => {
      if (err) {
        log.error(err.message)
        process.exit(1)
      }
      resolve(result)
    })
  )

const applyPostProcessing = ({ css }) =>
  new Promise(resolve =>
    postcss(autoprefixer({
      browsers: ['last 2 versions', '> 2%'],
      flexbox: 'no-2009' }))
    .process(css)
    .then(_ => resolve(_))
  )

const writeCssFile = css =>
  new Promise(resolve =>
    fs.writeFile(path.join(dist(), '/OPS/stylesheets/application.css'), css, (err) => {
      if (err) { throw err }
      resolve()
    })
  )

const sass = () =>
  new Promise((resolve) => {
    ensureCssDir()
    .then(createScssString)
    .then(renderCss)
    .then(applyPostProcessing)
    .then(writeCssFile)
    .catch(err => log.error(err))
    .then(resolve)
  })


export default sass
