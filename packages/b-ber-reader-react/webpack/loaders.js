const path = require('path')

const exclude = [/node_modules/]

module.exports = [
  {
    test: /\.(eot|woff2?|otf|ttf|svg)$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 1000,
        name: 'fonts/[name].[ext]',
        publicPath: '.',
      },
    },
  },
  {
    test: /\.svg$/,
    exclude: [...exclude, path.resolve(__dirname, '..', 'assets', 'fonts')],
    use: {
      loader: 'url-loader',
      options: {
        limit: 1000,
        mimetype: 'image/svg+xml',
      },
    },
  },
  {
    test: /\.gif/,
    exclude,
    use: {
      loader: 'url-loader',
      options: {
        limit: 1000,
        mimetype: 'image/gif',
      },
    },
  },
  {
    test: /\.jpe?g/,
    exclude,
    use: {
      loader: 'url-loader',
      options: {
        limit: 1000,
        mimetype: 'image/jpg',
      },
    },
  },
  {
    test: /\.png/,
    exclude,
    use: {
      loader: 'url-loader',
      options: {
        limit: 1000,
        mimetype: 'image/png',
      },
    },
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

            // https://github.com/webpack/webpack/issues/4039
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
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-optional-chaining',
      ],
    },
  },
]
