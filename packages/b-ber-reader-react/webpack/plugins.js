const { DefinePlugin, NoEmitOnErrorsPlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')

const plugins = [
  // Remove empty CSS files from the generated package and HTML
  new RemoveEmptyScriptsPlugin(),
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
