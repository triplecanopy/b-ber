/* eslint-disable import/no-extraneous-dependencies */

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const filename =
  process.env.NODE_ENV === 'production' ? '[hash].css' : 'bundle.css'
const quotedEnv = JSON.stringify(process.env.NODE_ENV || 'development')

let plugins = [
  // new BundleAnalyzerPlugin({
  //   openAnalyzer: false, // report.html
  //   analyzerMode: 'static',
  // }),

  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: quotedEnv,
    },
  }),

  new webpack.NoEmitOnErrorsPlugin(),

  new ExtractTextPlugin({
    filename,
    allChunks: true,
  }),

  new HtmlWebpackPlugin({
    template: './template.ejs',
    files: {
      css: ['bundle.css'],
      js: ['bundle.js'],
    },
  }),
]

if (process.env.NODE_ENV === 'development') {
  plugins = plugins.concat(new webpack.HotModuleReplacementPlugin())
}

module.exports = plugins
