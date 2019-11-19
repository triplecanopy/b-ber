import path from 'path'
import fs from 'fs-extra'
import isArray from 'lodash/isArray'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb
const cwd = process.cwd()

// Copy directories of assets into the output directory
const copy = () => {
    let { ignore } = state.config
    if (!isArray(ignore)) ignore = []

    ignore = ignore.reduce((acc, curr) => {
        acc[path.resolve(cwd, curr)] = true
        return acc
    }, {})

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
    ].filter(dir => !ignore[dir.from])

    const promises = dirs.map(dir =>
        fs
            .mkdirp(dir.to)
            .then(() => fs.mkdirp(dir.from))
            .then(() =>
                fs.copy(dir.from, dir.to, {
                    overwrite: false,
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
                            'copy [%s - {%d}] Large file sizes may cause performance issues in some output formats',
                            file,
                            size
                        )
                    }
                })
            })
    )

    return Promise.all(promises).catch(log.error)
}

export default copy
