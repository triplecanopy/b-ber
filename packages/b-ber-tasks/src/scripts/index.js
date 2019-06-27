import path from 'path'
import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import uglifyJS from 'uglify-js'

const uglifyOptions = state.config.uglify_options || {
    compress: {
        dead_code: true,
        conditionals: true,
        booleans: true,
    },
}

const uglify = contents => {
    const result = uglifyJS.minify(contents, uglifyOptions)
    if (result.error) throw result.error
    if (result.warnings) log.warn(result.warnings)
    return result.code
}

const optimized = files => {
    const contents = files.map(file => fs.readFileSync(path.resolve(state.src.javascripts(file)), 'utf8')).join('')
    const js = uglify(contents)
    const { hash } = state
    const out = state.dist.javascripts(`${hash}.js`)

    return fs
        .writeFile(out, js)
        .then(() => log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(out)}`))
}

const unoptimized = files => {
    const promises = files.map(file => {
        const input = state.src.javascripts(file)
        const output = state.dist.javascripts(file)
        return fs
            .copy(input, output)
            .then(() => log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(output)}`))
    })

    return Promise.all(promises)
}

const write = () =>
    fs.readdir(state.src.javascripts()).then(_files => {
        const files = _files.filter(a => path.extname(a) === '.js')
        return (state.env === 'production' ? optimized : unoptimized)(files)
    })

const ensureDir = () => fs.mkdirp(state.dist.javascripts())

const scripts = () =>
    ensureDir()
        .then(write)
        .catch(log.error)

export default scripts
