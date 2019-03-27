import path from 'path'
import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import uglifyJS from 'uglify-js'

const cwd = process.cwd()

const uglifyOptions = state.config.uglify_options || {
    warnings: true,
    compress: {
        dead_code: true,
        conditionals: true,
        booleans: true,
        warnings: true,
    },
}

const uglify = contents => {
    const result = uglifyJS.minify(contents, uglifyOptions)
    if (result.error) throw result.error
    if (result.warnings) log.warn(result.warnings)
    return result.code
}

const optimized = files => {
    const contents = files.map(a => fs.readFileSync(path.resolve(cwd, state.src, '_javascripts', a), 'utf8')).join('')
    const js = uglify(contents)
    const { hash } = state
    const out = path.join(state.dist, 'OPS', 'javascripts', `${hash}.js`)

    return fs
        .writeFile(out, js)
        .then(() => log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(out)}`))
}

const unoptimized = files => {
    const promises = files.map(file => {
        const input = path.join(state.src, '_javascripts', file)
        const output = path.join(state.dist, 'OPS', 'javascripts', file)
        return fs
            .copy(input, output)
            .then(() => log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(output)}`))
    })

    return Promise.all(promises).catch(log.error)
}

const write = () =>
    fs.readdir(path.join(state.src, '_javascripts')).then(_files => {
        const files = _files.filter(a => path.extname(a) === '.js')
        return (state.env === 'production' ? optimized : unoptimized)(files)
    })

const ensureDir = () => fs.mkdirp(path.join(state.dist, 'OPS', 'javascripts'))

const scripts = () =>
    ensureDir()
        .then(write)
        .catch(log.error)

export default scripts
