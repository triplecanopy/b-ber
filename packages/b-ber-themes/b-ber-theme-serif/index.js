const fs = require('fs')
const path = require('path')
const npmPackage = require('./package.json')

module.exports = {
    name: 'serif',
    entry: path.join(__dirname, 'application.scss'),
    fonts: (() => {
        const fontsDir = path.join(__dirname, 'fonts')
        return fs.existsSync(fontsDir)
            ? fs
                .readdirSync(fontsDir)
                .filter(a => /\.(otf|ttf|woff2?|eot)/i.test(path.extname(a)))
            : []
    })(),
    images: [],
    npmPackage,
}
