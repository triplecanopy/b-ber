module.exports = api => {
  console.log('Loading root babel.config.js from %s', __dirname)

  const env = api.env()

  const envOptsNoTargets = {
    corejs: 3,
    // debug = true,
    // loose: true,
    modules: 'commonjs',
    useBuiltIns: 'usage',
  }

  const envOpts = Object.assign({}, envOptsNoTargets)
  const nodeVersion = '10'

  switch (env) {
    // Configs used during bundling builds.
    case 'production':
      // Config during builds before publish.
      envOpts.targets = {
        node: nodeVersion,
        // browsers: 'last 2 versions, > 2%',
      }
      break
    case 'development':
      envOpts.targets = {
        node: 'current',
      }
      break
    case 'test':
      envOpts.targets = {
        node: 'current',
      }
      break
    default:
      break
  }

  return {
    // babelrcRoots: ['.', 'packages/*'],
    ignore: ['node_modules'],
    presets: [['@babel/env', envOpts], '@babel/preset-react'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/transform-modules-commonjs', { lazy: env !== 'test' }], // fixes jest 'cannot find module' error
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
    ].filter(Boolean),
  }
}
