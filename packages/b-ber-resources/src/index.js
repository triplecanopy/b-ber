import path from 'path'
import fs from 'fs-extra'

// Returns directory listings as {fileName: absoluteFilePath}
export default () =>
    new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname), (err, data) => {
            if (err) reject(err)

            const assets = {}
            data.filter(a => /png|jpe?g/.test(path.extname(a))).map(
                a => (assets[path.basename(a, path.extname(a))] = path.join(__dirname, a))
            )

            resolve(assets)
        })
    })
