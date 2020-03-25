module.exports = api => {
  console.log('Loading root babel.config.js from %s\n', __dirname)

  const env = api.env()

  const supportedNodeVersion = '10'
  const targetNodeTargets =
    env === 'production' ? supportedNodeVersion : 'current'

  // Should match targets in packages/b-ber-reader/webpack.config.<env>.js
  const supportedWebTargets = 'last 2 versions, > 2%'

  // Settings for @babel/transform-modules-commonjs
  const lazy = env !== 'test'

  // Config for the node-based CLI packages
  const envOptsNode = {
    debug: false,
    modules: 'auto',
    corejs: false,
    useBuiltIns: false,
    targets: {
      node: targetNodeTargets,
    },
  }

  // Config for the web-based reader package
  const envOptsReader = {
    debug: false,
    modules: 'auto',
    corejs: 3,
    useBuiltIns: 'usage',
    targets: {
      browsers: supportedWebTargets,
    },
  }

  return {
    ignore: ['node_modules'],
    presets: [['@babel/env', envOptsNode]],

    // Base plugin settings for CLI packages
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          absoluteRuntime: false,
          corejs: 3,
          helpers: true,
          regenerator: true,
          useESModules: false,
        },
      ],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
    ],

    // Override options for reader. See https://babeljs.io/docs/en/options#merging
    overrides: [
      {
        test: './packages/b-ber-reader',
        presets: [['@babel/env', envOptsReader], '@babel/preset-react'],
        plugins: [
          // Disabled for web builds
          ['@babel/plugin-transform-runtime', false],
          // Fixes jest 'cannot find module' error during tests
          ['@babel/transform-modules-commonjs', { lazy }],
        ],
      },
    ],
  }
}
