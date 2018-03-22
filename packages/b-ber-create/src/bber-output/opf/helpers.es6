/* eslint-disable import/prefer-default-export */
import path from 'path'
import { opsPath } from 'bber-utils'

const isRemote = file => /^http/.test(file)

const pathInfoFromFile = (file, dest) => {
    if (isRemote(file)) {
        return {
            absolutePath: file,
            opsPath: file,
            name: file,
            extension: '',
            remote: true,
        }
    } else {
        return {
            absolutePath: file,
            opsPath: opsPath(file, dest),
            name: path.basename(file),
            extension: path.extname(file),
            remote: false,
        }
    }
}

const pathInfoFromFiles = (arr, dest) =>
    arr.map(file => pathInfoFromFile(file, dest))

export { pathInfoFromFiles }
