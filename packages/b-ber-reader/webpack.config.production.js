const path = require('path')
const webpack = require('webpack')
const loaders = require('./webpack.loaders')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    target: 'web',
    context: path.join(__dirname, 'src'),
    entry: './index.jsx',
    output: {
        publicPath: '/',
        path: path.join(__dirname, 'dist'),
        filename: '[hash].js',
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|public|dist|test|__tests__)/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                corejs: 3,
                                modules: 'commonjs',
                                targets: {
                                    browsers: 'last 2 versions, > 2%',
                                },
                                useBuiltIns: 'usage',
                            },
                        ],
                        '@babel/preset-react',
                    ],
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        '@babel/plugin-proposal-class-properties',
                        '@babel/plugin-proposal-object-rest-spread',
                    ],
                },
            },

            {
                test: /\.scss$/,
                exclude: /(node_modules|public|dist|test)/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { loader: 'css-loader' },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                // eslint-disable-next-line global-require
                                plugins: [require('autoprefixer')(), require('cssnano')()],
                            },
                        },
                        { loader: 'sass-loader' },
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
