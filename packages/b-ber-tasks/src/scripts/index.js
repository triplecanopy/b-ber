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

const optimized = files =>
    new Promise(resolve => {
        const contents = files.map(a => fs.readFileSync(path.resolve(cwd, state.src, '_javascripts', a), 'utf8')).join('')
        const js = uglify(contents)
        const {hash} = state
        const out = path.join(state.dist, 'OPS', 'javascripts', `${hash}.js`)

        fs.writeFile(out, js, err => {
            if (err) throw err
            log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(out)}`)
            resolve()
        })
    })

const unoptimized = files => {
    const promises = []
    return new Promise(resolve => {
        files.forEach(file => {
            promises.push(new Promise(resolve => {
                const out = path.join(state.dist, 'OPS', 'javascripts', file)
                fs.copy(path.join(state.src, '_javascripts', file), out, err => {
                    if (err) throw err
                    log.info('scripts emit [%s]', `javascripts${path.sep}${path.basename(out)}`)
                    resolve()
                })
            }))
        })
        Promise.all(promises).then(resolve)
    })
}


const write = () =>
    new Promise(resolve => {
        const promises = []
        fs.readdir(path.join(state.src, '_javascripts'), (err, _files) => {
            if (err) throw err
            const files = _files.filter(a => path.extname(a) === '.js')//.map(a => path.join('_javascripts', a))
            promises.push((state.env === 'production' ? optimized : unoptimized)(files))
            Promise.all(promises).then(resolve)
        })
    })


const ensureDir = () =>
    new Promise(resolve =>
        fs.mkdirp(path.join(state.dist, 'OPS', 'javascripts'), err => {
            if (err) throw err
            resolve()
        })
    )

const scripts = () =>
    new Promise(resolve =>
        ensureDir()
            .then(write)
            .catch(err => log.error(err))
            .then(resolve)
    )

export default scripts
