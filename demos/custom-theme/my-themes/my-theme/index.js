const path = require('path')

module.exports = {
    name: require('./package.json').name,
    entry: path.join(__dirname, 'application.scss'),
    fonts: [],
    images: ['image.jpg'],
}

