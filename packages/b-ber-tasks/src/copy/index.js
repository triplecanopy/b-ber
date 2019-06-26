import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb
const cwd = process.cwd()

// Copy directories of assets into the output directory
const copy = () =>
    new Promise(resolve => {
        // resolve paths in ignore
        let { ignore } = state.config
        if (ignore.constructor !== Array) ignore = []
        ignore = ignore.map(a => path.resolve(cwd, a))

        const promises = []
        let dirs = []

        dirs = [
            {
                from: path.resolve(state.src.images()),
                to: path.resolve(state.dist.images()),
            },
            {
                from: path.resolve(state.src.fonts()),
                to: path.resolve(state.dist.fonts()),
            },
            {
                from: path.resolve(state.src.media()),
                to: path.resolve(state.dist.media()),
            },
        ]

        dirs = dirs.filter(a => ignore.indexOf(a.from) < 0)

        dirs.forEach(a => {
            promises.push(
                new Promise(resolve1 => {
                    try {
                        fs.mkdirpSync(a.to)
                        fs.mkdirpSync(a.from) // ensure `from` dir exists

                        fs.copySync(a.from, a.to, {
                            overwrite: false,
                            errorOnExist: true,
                            filter: file => path.basename(file).charAt(0) !== '.' && !ignore[file],
                        })
                    } catch (err) {
                        throw err
                    }

                    const baseTo = `${path.basename(a.to)}`

                    fs.readdirSync(a.to).forEach(file => {
                        const size = fs.statSync(path.join(a.to, file)).size
                        log.info('copy [%s - {%d}]', `${baseTo}/${file}`, size)
                        if (size > FILE_SIZE_WARNING_LIMIT) {
                            log.warn(
                                '[%s - {%d}] exceeds recommended file size of {%d}',
                                file,
                                size,
                                FILE_SIZE_WARNING_LIMIT,
                            )
                        }
                    })

                    resolve1()
                }),
            )
        })

        Promise.all(promises)
            .catch(log.error)
            .then(resolve)
    })

export default copy
