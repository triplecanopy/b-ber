const fs = require('fs')
const path = require('path')
const npmPackage = require('./package.json')

module.exports = {
  name: 'b-ber-theme-serif',
  entry: path.join(__dirname, 'application.scss'),
  fonts: (() =>
    fs
      .readdirSync(path.join(__dirname, 'fonts'))
      .filter(file => /\.(otf|ttf|woff2?|eot)/i.test(path.extname(file))))(),
  images: (() =>
    fs
      .readdirSync(path.join(__dirname, 'images'))
      .filter(file => /\.(jpe?g|png|gif)/i.test(path.extname(file))))(),
  npmPackage,
}
