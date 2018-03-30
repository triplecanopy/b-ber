/* eslint-disable global-require */
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
    output: {
        publicPath: '/',
        path: path.join(__dirname, 'dist'),
        filename: '[hash].js',
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
            test: /\.sss/,
            exclude: /(node_modules|public|dist|test)/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {loader: 'css-loader'},
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: false,
                            parser: 'sugarss',
                            plugins: _ => [
                                require('autoprefixer')({}),
                                require('cssnano')({preset: 'default'}),
                            ],
                        },
                    },
                ],
            }),

        },

        ...loaders,

        ],
    },


    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
            },
        }),

        // new BundleAnalyzerPlugin({
        //     openAnalyzer: true,
        // }),

        new webpack.NoEmitOnErrorsPlugin(),

        new ExtractTextPlugin({
            filename: '[hash].css',
            allChunks: true,
        }),

        new HtmlWebpackPlugin({
            template: './template.ejs',
            files: {
                css: ['bundle.css'],
                js: ['bundle.js'],
            },
        }),

    ],
}
