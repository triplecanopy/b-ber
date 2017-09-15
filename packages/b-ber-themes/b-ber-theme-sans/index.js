const fs = require('fs')
const path = require('path')
const npmPackage = require('./package.json')

module.exports = {
    name: npmPackage.name,
    entry: path.join(__dirname, 'application.scss'),
    fonts: [],
    images: [],
    npmPackage: npmPackage,
}
