import path from 'path'
import fs from 'fs-extra'
import nodeSass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

// dirnames that may be referenced in the theme. we copy over assets when
// running the sass task
const ASSET_DIRNAMES = ['fonts', 'images']

const autoprefixerOptions = state.config.autoprefixer_options || {
    overrideBrowserslist: ['last 2 versions', '> 2%'],
    flexbox: 'no-2009',
}

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const createSCSSString = () => {
    const chunks = []
    const { theme } = state
    const themeName = theme.name

    const themeSettingsPath = state.src.stylesheets(themeName, '_settings.scss')
    const themeOverridesPath = state.src.stylesheets(themeName, '_overrides.scss')
    const themeStylesPath = theme.entry

    // load user-defined variables
    if (fs.existsSync(themeSettingsPath)) {
        const variableOverrides = fs.readFileSync(themeSettingsPath)
        log.info(`sass use overrides [${path.basename(themeSettingsPath)}]`)
        log.info('sass prepend overrides')
        chunks.push(variableOverrides)
    }

    // load theme styles
    if (fs.existsSync(themeStylesPath)) {
        const themeStyles = fs.readFileSync(themeStylesPath)
        log.info(`sass attempt build with [${themeName}] theme`)
        chunks.push(themeStyles)
    }

    // load user-defined styles
    if (fs.existsSync(themeOverridesPath)) {
        const styleOverrides = fs.readFileSync(themeOverridesPath)
        log.info(`sass use user-defined styles [${path.basename(themeOverridesPath)}]`)
        log.info('sass append user-defined styles')
        chunks.push(styleOverrides)
    }

    if (chunks.length < 1) log.error('No readable stylesheets were found')

    return Buffer.concat(chunks)
}

// make sure the compiled output dir exists
const ensureCSSDir = () => fs.mkdirp(state.dist.stylesheets())

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
    const { theme } = state

    const fileData = ASSET_DIRNAMES.reduce((acc, curr) => {
        const themePath = path.resolve(path.dirname(theme.entry), curr)
        const srcPath = state.src.root(`_${curr}`)

        fs.mkdirpSync(srcPath)

        try {
            fs.lstatSync(themePath).isDirectory()
        } catch (err) {
            if (err.code === 'ENOENT') return acc
            throw new Error(`There was a problem copying [${themePath}] to [${srcPath}]`)
        }

        const data = fs
            .readdirSync(themePath)
            .filter(a => a.charAt(0) !== '.')
            .map(fileName => ({
                input: path.join(themePath, fileName),
                output: path.join(srcPath, fileName),
            }))

        return acc.concat(data)
    }, [])

    const promises = fileData.map(({ input, output }) =>
        fs.copy(input, output, {
            overwrite: false,
            errorOnExist: false,
        })
    )

    return Promise.all(promises)
}

const renderCSS = scssString =>
    new Promise(resolve =>
        nodeSass.render(
            {
                data: `$build: "${state.build}";${scssString}`,
                includePaths: [
                    state.src.stylesheets(),
                    path.dirname(state.theme.entry),
                    path.dirname(path.dirname(state.theme.entry)),
                ],
                outputStyle: state.env === 'production' ? 'compressed' : 'nested',
                errLogToConsole: true,
            },
            (err, result) => {
                if (err) throw err
                resolve(result)
            }
        )
    )

const applyPostProcessing = ({ css }) => postcss(autoprefixer(autoprefixerOptions)).process(css, { from: undefined })

const writeCSSFile = cssString => {
    const fileName = state.env === 'production' ? `${state.hash}.css` : 'application.css'
    return fs.writeFile(state.dist.stylesheets(fileName), cssString)
}

const sass = () =>
    ensureCSSDir()
        .then(copyThemeAssets)
        .then(createSCSSString)
        .then(renderCSS)
        .then(applyPostProcessing)
        .then(writeCSSFile)
        .catch(log.error)

export default sass
