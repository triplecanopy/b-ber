import path from 'path'
import fs from 'fs-extra'

// Returns directory listing as an object with { fileName: absoluteFilePath } schema
export default () =>
    new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname), (err, data) => {
            if (err) { reject(err) }
            const assets = {}
            data.map(a => assets[path.basename(a, path.extname(a))] = path.join(__dirname, a))
            resolve(assets)
        })
    })
