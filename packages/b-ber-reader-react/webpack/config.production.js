/* eslint-disable global-require */

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const common = require('./common')
const loaders = require('./loaders')
const plugins = require('./plugins')

module.exports = {
  ...common,
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
