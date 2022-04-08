/* eslint-disable global-require */

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const common = require('./common')
const loaders = require('./loaders')
const plugins = require('./plugins')

module.exports = {
  ...common,

  mode: 'production',

  entry: {
    index: './index.jsx',
    styles: './index.scss',
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

  plugins,

  module: {
    rules: [
      ...loaders,

      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [require('autoprefixer')(), require('cssnano')()],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
            },
          },
        ],
      },
    ],
  },
}
