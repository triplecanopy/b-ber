const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: './index.js',
  module: {
    rules: [
      {
        test: /\.(eot|woff2?|otf|ttf|svg)$/,
        exclude: /(test|__tests__|epub)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1000,
              mimetype: 'application/octet-stream',
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],

    // https://github.com/facebook/react/issues/13991
    alias: {
      react: path.resolve('../../node_modules/react'),
      'react-dom': path.resolve('../../node_modules/react-dom'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './template.ejs',
    }),
  ],
}
