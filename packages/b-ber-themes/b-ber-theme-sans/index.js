const path = require('path')
const npmPackage = require('./package.json')

module.exports = {
    name: 'sans',
    entry: path.join(__dirname, 'application.scss'),
    fonts: [],
    images: [],
    npmPackage,
}
