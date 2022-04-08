const path = require('path')

module.exports = {
  target: 'web',
  context: path.resolve(__dirname, '..', 'src'),
  devtool: process.env.NODE_ENV === 'production' ? 'none' : 'source-map',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '..', 'dist'),
    filename: data =>
      /\.min/.test(data.chunk.name) ? '[name].[hash].js' : '[name].js',

    library: {
      root: 'BberReader',
    },

    libraryTarget: 'umd',
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },
}
