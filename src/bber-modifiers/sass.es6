
/**
 * @module sass
 */

// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import Promise from 'vendor/Zousan'
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
    try {
      const customSCSS = path.join(src(), '_stylesheets/application.scss')
      if (fs.existsSync(customSCSS)) {
        return fs.readFile(customSCSS, (err, buffer) => {
          if (err) { throw err }
          log.info('Using SCSS overrides from `_stylesheets/application.scss`')
          return resolve(buffer)
        })
      }
    } catch (err) {
      log.info(`Attempting to build with [${theme().tname}] theme`)
    }

    const themeSCSS = path.join(theme().tpath, 'application.scss')
    try {
      if (fs.existsSync(themeSCSS)) {
        return fs.readFile(themeSCSS, (err, buffer) => {
          if (err) { throw err }
          log.info(`Using theme [${theme().tname}]`)
          return resolve(buffer)
        })
      }
    } catch (err) {
      return log.error(`
        Could not find theme [${theme().tname}].
        Make sure the theme exists and contains a valid [application.scss]`)
    }

    throw new Error('Something went wrong compiling the SCSS.')
  })

const ensureCssDir = () =>
  new Promise(resolve =>
    fs.mkdirs(path.join(dist(), '/OPS/stylesheets'), (err) => {
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
    }, (err, result) => resolve(result))
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
