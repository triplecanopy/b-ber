const fs = require('fs')
const path = require('path')
const npmPackage = require('./package.json')

module.exports = {
    name: npmPackage.name,
    entry: path.join(__dirname, 'application.scss'),
    fonts: fs
        .readdirSync(path.join(__dirname, 'fonts'))
        .filter(a => /\.(otf|ttf|woff2?|eot|svg)/i.test(path.extname(a))),
    images: [],
    npmPackage,
}
