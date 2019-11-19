const path = require('path')

module.exports = [
  {
    test: /\.(eot|woff2?|otf|ttf|svg)$/,
    loader: 'url-loader?limit=10000&mimetype=application/octet-stream',
  },
  {
    test: /\.svg$/,
    exclude: [/node_modules/, path.resolve(__dirname, 'assets', 'fonts')],
    loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
  },
  {
    test: /\.gif/,
    exclude: /node_modules/,
    loader: 'url-loader?limit=10000&mimetype=image/gif',
  },
  {
    test: /\.jpe?g/,
    exclude: /node_modules/,
    loader: 'url-loader?limit=10000&mimetype=image/jpg',
  },
  {
    test: /\.png/,
    exclude: /node_modules/,
    loader: 'url-loader?limit=10000&mimetype=image/png',
  },
]
