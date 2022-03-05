const path = require('path')

module.exports = {
  target: 'web',
  context: path.resolve(__dirname, '..', 'src'),
  entry: {
    index: './index.jsx',
    styles: './index.scss',
  },
  devtool: process.env.NODE_ENV === 'production' ? 'none' : 'source-map',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '..', 'dist'),
    filename: data =>
      /\.min/.test(data.chunk.name) ? '[name].[hash].js' : '[name].js',
    libraryTarget: 'umd',
  },

  // Use external version of React
  // https://github.com/facebook/react/issues/13991
  // Still unable to use `npm link`, but the project can be loaded from a
  // tarball for development
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React',
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM',
    },
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },
}
