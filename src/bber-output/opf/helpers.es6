/* eslint-disable import/prefer-default-export */
import path from 'path'
import { opsPath } from 'bber-utils'

const pathInfoFromFile = (file, dest) => ({
    rootPath: file,
    opsPath: opsPath(file, dest),
    name: path.basename(file),
    extension: path.extname(file),
})

const pathInfoFromFiles = (arr, dest) =>
    arr.map(file => pathInfoFromFile(file, dest))

export { pathInfoFromFiles }
