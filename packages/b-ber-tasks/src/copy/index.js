import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb
const cwd = process.cwd()

// Copy directories of assets into the output directory
const copy = () => {
    // resolve paths in ignore
    let { ignore } = state.config
    if (ignore.constructor !== Array) ignore = []
    ignore = ignore.map(file => path.resolve(cwd, file))

    const dirs = [
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
    ].filter(dir => ignore.indexOf(dir.from) < 0)

    const promises = dirs.map(dir =>
        fs
            .mkdirp(dir.to)
            .then(() => fs.mkdirp(dir.from))
            .then(() =>
                fs.copy(dir.from, dir.to, {
                    overwrite: false,
                    // errorOnExist: true,
                    filter: file => path.basename(file).charAt(0) !== '.' && !ignore[file],
                })
            )
            .then(() => fs.readdir(dir.to))
            .then(files => {
                const baseTo = `${path.basename(dir.to)}`
                files.forEach(file => {
                    const { size } = fs.statSync(path.join(dir.to, file))

                    log.info('copy [%s - {%d}]', `${baseTo}/${file}`, size)

                    if (size > FILE_SIZE_WARNING_LIMIT) {
                        log.warn(
                            'copy [%s - {%d}] exceeds recommended file size of {%d}',
                            file,
                            size,
                            FILE_SIZE_WARNING_LIMIT
                        )
                    }
                })
            })
    )

    return Promise.all(promises).catch(log.error)
}

export default copy
