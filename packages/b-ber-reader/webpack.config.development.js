const path = require('path')
const webpack = require('webpack')
const loaders = require('./webpack.loaders')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')

module.exports = {
    target: 'web',
    context: path.join(__dirname, 'src'),
    entry: ['babel-polyfill', './index.jsx'],
    devtool: 'source-map',
    output: {
        publicPath: '/',
        path: path.join(__dirname, 'public'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            exclude: /(node_modules|public|dist|test)/,
            loader: 'babel-loader',
        },

        {
            test: /\.scss$/,
            exclude: /(node_modules|public|dist|test)/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {loader: 'css-loader'},
                    {loader: 'sass-loader'},
                ],
            }),

        },

        ...loaders,

        ],
    },

    plugins: [
        new BundleAnalyzerPlugin({
            openAnalyzer: false, // report.html
            analyzerMode: 'static',
        }),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development'),
            },
        }),


        new webpack.NoEmitOnErrorsPlugin(),

        new ExtractTextPlugin({
            filename: 'bundle.css',
            allChunks: true,
        }),

        new webpack.HotModuleReplacementPlugin(),

        new HtmlWebpackPlugin({
            template: './template.ejs',
            files: {
                css: ['bundle.css'],
                js: ['bundle.js'],
            },
        }),
    ],
}
