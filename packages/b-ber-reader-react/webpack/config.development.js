/* eslint-disable global-require */

const { HotModuleReplacementPlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')

const common = require('./common')
const loaders = require('./loaders')
const plugins = require('./plugins')

module.exports = {
  ...common,

  mode: 'development',

  entry: {
    index: '../dev/index.js',
    styles: './index.scss',
  },

  plugins: [
    ...plugins,
    new HTMLWebpackPlugin({ template: '../dev/index.ejs' }),
    new HotModuleReplacementPlugin(),
  ],

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
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
            },
          },
        ],
      },
    ],
  },

  devServer: {
    port: '3000',
    open: true,
    hot: true,
    liveReload: true,
  },
}
