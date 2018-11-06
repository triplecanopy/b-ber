const fs = require('fs')
const path = require('path')
const npmPackage = require('./package.json')

const fontRegExp = new RegExp('.(otf|ttf|woff2?|eot)', 'i') // SVG fonts break epub validation
const vendorFontsPath = path.join(__dirname, 'fonts')
const iconFontsPath = path.join(
    __dirname,
    'node_modules',
    'material-icons',
    'iconfont'
)

module.exports = {
    name: 'tc',
    entry: path.join(__dirname, 'application.scss'),
    fonts: [
        ...fs
            .readdirSync(vendorFontsPath)
            .filter(a => fontRegExp.test(path.extname(a)))
            .map(a => path.join(vendorFontsPath, a)),
        ...fs
            .readdirSync(iconFontsPath)
            .filter(a => fontRegExp.test(path.extname(a)))
            .map(a => path.join(iconFontsPath, a)),
    ],
    images: [],
    npmPackage,
}
