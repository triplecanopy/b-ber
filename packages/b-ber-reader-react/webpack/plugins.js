/* eslint-disable import/no-extraneous-dependencies */

const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  NoEmitOnErrorsPlugin,
} = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
const {
  HtmlWebpackSkipAssetsPlugin,
} = require('html-webpack-skip-assets-plugin')

// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const quotedEnv = JSON.stringify(process.env.NODE_ENV || 'development')

let plugins = [
  // Remove css.js files from the generated package and HTML
  new FixStyleOnlyEntriesPlugin(),

  new DefinePlugin({
    'process.env': {
      NODE_ENV: quotedEnv,
    },
  }),

  new NoEmitOnErrorsPlugin(),

  new MiniCssExtractPlugin({
    filename: data =>
      /\.min/.test(data.chunk.name) ? '[name].[hash].css' : '[name].css',
  }),

  new HtmlWebpackPlugin({
    template: './template.ejs',
  }),

  // Don't add non-hashed scripts/styles to index.html
  new HtmlWebpackSkipAssetsPlugin({
    excludeAssets: [
      asset => {
        if (!asset.attributes) return false

        const attr = asset.attributes.href || asset.attributes.src

        return /\.min/.test(attr) === false
      },
    ],
  }),

  // new BundleAnalyzerPlugin({
  //   openAnalyzer: false, // report.html
  //   analyzerMode: 'static',
  // }),
]

if (process.env.NODE_ENV === 'development') {
  plugins = plugins.concat(new HotModuleReplacementPlugin())
}

module.exports = plugins
