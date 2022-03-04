const path = require('path')

const devtool = process.env.NODE_ENV === 'production' ? 'none' : 'source-map'
const filename =
  process.env.NODE_ENV === 'production' ? '[hash].js' : '[name].js'

module.exports = {
  target: 'web',
  context: path.resolve(__dirname, '..', 'src'),
  entry: {
    app: './index.jsx',
    css: './index.scss',
  },
  devtool,
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '..', 'dist'),
    filename,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
}
