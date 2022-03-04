const path = require('path')

const exclude = [/(node_modules|dist|test|__tests__|epub)/]

module.exports = [
  {
    test: /\.(eot|woff2?|otf|ttf|svg)$/,
    exclude: /(dist|test|__tests__|epub)/,
    loader: 'url-loader?limit=10000&mimetype=application/octet-stream',
  },
  {
    test: /\.svg$/,
    exclude: [...exclude, path.resolve(__dirname, '..', 'assets', 'fonts')],
    loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
  },
  {
    test: /\.gif/,
    exclude,
    loader: 'url-loader?limit=10000&mimetype=image/gif',
  },
  {
    test: /\.jpe?g/,
    exclude,
    loader: 'url-loader?limit=10000&mimetype=image/jpg',
  },
  {
    test: /\.png/,
    exclude,
    loader: 'url-loader?limit=10000&mimetype=image/png',
  },
  {
    test: /\.jsx?$/,
    exclude,
    loader: 'babel-loader',
    options: {
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            bugfixes: true,
            corejs: 3,
            modules: 'commonjs', // https://github.com/webpack/webpack/issues/4039
            targets: {
              browsers: 'last 2 versions, > 2%',
            },
            useBuiltIns: 'usage',
          },
        ],
        '@babel/preset-react',
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-optional-chaining',
      ],
    },
  },
]
