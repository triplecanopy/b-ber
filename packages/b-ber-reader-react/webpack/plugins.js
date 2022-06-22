const { DefinePlugin, NoEmitOnErrorsPlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const plugins = [
  // Remove css.js files from the generated package and HTML
  new FixStyleOnlyEntriesPlugin(),
  new DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  }),
  new NoEmitOnErrorsPlugin(),
  new MiniCssExtractPlugin({ filename: '[name].css' }),
]

if (process.env.BUNDLE_ANALYZER) {
  plugins.push(new BundleAnalyzerPlugin())
}

module.exports = plugins
