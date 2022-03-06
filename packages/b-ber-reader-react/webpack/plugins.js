const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  NoEmitOnErrorsPlugin,
} = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')

let plugins = [
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

if (process.env.NODE_ENV === 'development') {
  plugins = plugins.concat(new HotModuleReplacementPlugin())
}

module.exports = plugins
