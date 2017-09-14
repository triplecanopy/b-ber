/**
 * @module sass
 */

// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import nodeSass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import { log } from 'bber-plugins'
import { src, dist, env, build, theme } from 'bber-utils'

// dirnames that may be referenced in the theme. we copy over assets when
// running the sass task
const ASSET_DIRNAMES = ['fonts', 'images']

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const createScssString = () =>
    new Promise((resolve) => { // eslint-disable-line consistent-return
        const chunks = []
        const variableOverridesPath = path.join(src(), '_stylesheets/variable-overrides.scss')
        const styleOverridesPath = path.join(src(), '_stylesheets/style-overrides.scss')
        const themeStylesPath = path.join(theme().path, 'application.scss')

        try {
            if (fs.existsSync(variableOverridesPath)) {
                const variableOverrides = fs.readFileSync(variableOverridesPath)
                log.info(`bber-modifiers/sass: Found SCSS variable overrides: ${path.basename(variableOverridesPath)}`)
                log.info('bber-modifiers/sass: Prepending overrides to SCSS stream')
                chunks.push(variableOverrides)
            }
        } catch (err) {
            log.info('bber-modifiers/sass: Building SCSS without user-defined overrides')
        }

        try {
            if (fs.existsSync(themeStylesPath)) {
                const themeStyles = fs.readFileSync(themeStylesPath)
                log.info(`bber-modifiers/sass: Attempting build with [${theme().name}] theme`)
                chunks.push(themeStyles)
            }
        } catch (err) {
            log.error(`bber-modifiers/sass:
                Could not find theme [${theme().name}].
                Make sure the theme exists and contains a valid [application.scss]`)
        }

        try {
            if (fs.existsSync(styleOverridesPath)) {
                const styleOverrides = fs.readFileSync(styleOverridesPath)
                log.info(`bber-modifiers/sass: Found user-defined styles: ${path.basename(styleOverridesPath)}`)
                log.info('bber-modifiers/sass: Appending user-defined styles to SCSS stream')
                chunks.push(styleOverrides)
            }
        } catch (err) {
            log.info('bber-modifiers/sass: Building SCSS without user-defined styles')
        }


        if (chunks.length < 1) {
            const err = new Error('bber-modifiers/sass: No readable stylesheets were found.')
            log.error(err)
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

// copy assets that exist in theme directory to the corresponding directory in
// _project:
//
// my-theme/fonts/my-font.ttf    -> _project/_fonts/my-font.ttf
// my-theme/images/my-image.jpg  -> _project/_images/my-image.jpg
//
// if the asset already exists in the _project dir, it is *not* overwritten.
//
// these assets are then copied to the correct build dir by the `copy` task.
//
const copyThemeAssets = () => {
    new Promise((resolve) => {
        const promises = []
        ASSET_DIRNAMES.forEach((dir) => {
            promises.push(new Promise((resolve) => {
                const themePath = path.join(theme().path, dir)
                const srcPath = path.join(src(), `_${dir}`)


                try {
                    if (!fs.existsSync(srcPath)) {
                        fs.mkdirp(srcPath)
                    }
                } catch (err1) {
                    log.error(err1, 1)
                }

                try {
                    if (fs.lstatSync(themePath).isDirectory()) {
                        const files = fs.readdirSync(themePath)

                        files.forEach((file, i) => {
                            const input = path.join(themePath, file)
                            const output = path.join(srcPath, file)

                            fs.copy(input, output, {
                                overwrite: false,
                                errorOnExist: true,
                            }, (err2) => {
                                if (err2) { throw err2 }
                                if (i === files.length - 1) { // not sure about this...
                                    resolve()
                                }
                            })
                        })
                    }
                } catch (err0) {
                    if (err0.code === 'ENOENT') { return resolve() } // dir doesn't exist in the theme path, but doesn't need to, so proceed
                    log.error(`bber-modifiers/sass: There was a problem copying [${themePath}] to [${srcPath}]`)
                    log.error(err0)
                    resolve()
                }
            }))
        })

        Promise.all(promises).then(resolve)
    })
}

const renderCss = scssString =>
    new Promise(resolve =>
        nodeSass.render({
            data: `$build: "${build()}";${scssString}`,
            includePaths: [path.join(src(), '_stylesheets/'), theme().path],
            outputStyle: env() === 'production' ? 'compressed' : 'nested',
            errLogToConsole: true,
        }, (err, result) => {
            if (err) { log.error(err.message, 1) }
            resolve(result)
        })
    )

const applyPostProcessing = ({ css }) =>
    new Promise(resolve =>
        postcss(autoprefixer({
            browsers: ['last 2 versions', '> 2%'],
            flexbox: 'no-2009',
        }))
        .process(css)
        .then(resolve)
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
        .then(copyThemeAssets)
        .then(createScssString)
        .then(renderCss)
        .then(applyPostProcessing)
        .then(writeCssFile)
        .catch(err => log.error(err))
        .then(resolve)
    })


export default sass
