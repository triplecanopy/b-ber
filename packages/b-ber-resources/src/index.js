import path from 'path'
import fs from 'fs-extra'

// Returns directory listings as {fileName: absoluteFilePath}
export default () =>
    fs.readdir(path.join(__dirname)).then(data => {
        const assets = {}
        data.filter(a => /png|jpe?g/.test(path.extname(a))).map(
            a => (assets[path.basename(a, path.extname(a))] = path.join(__dirname, a))
        )

        return assets
    })
