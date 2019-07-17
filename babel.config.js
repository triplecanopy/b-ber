module.exports = api => {
    console.log('Loading root babel.config.js %s', __dirname)

    const env = api.env()

    const envOptsNoTargets = {
        corejs: 3,
        exclude: [],
        loose: true,
        modules: 'commonjs',
        useBuiltIns: 'usage',
    }

    const envOpts = Object.assign({}, envOptsNoTargets)

    // let convertESM = true
    // let ignoreLib = true
    // let includeRuntime = false
    const nodeVersion = '6'

    switch (env) {
        // Configs used during bundling builds.
        case 'production':
            // Config during builds before publish.
            // envOpts.debug = true
            envOpts.targets = {
                node: nodeVersion,
                // esmodules: true,
            }
            break
        case 'development':
            // envOpts.debug = true
            envOpts.targets = {
                node: 'current',
                // esmodules: true,
            }
            break
        case 'test':
            envOpts.targets = {
                node: 'current',
                // esmodules: true,
            }
            break
        default:
            break
    }

    return {
        // babelrcRoots: ['.', 'packages/*'],
        ignore: [
            'node_modules',
            // ignoreLib ? "packages/*/lib" : null,
        ],
        presets: [['@babel/env', envOpts], '@babel/preset-react'],
        plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-function-bind',

            // Explicitly use the lazy version of CommonJS modules.
            //   convertESM ? ["@babel/transform-modules-commonjs", { lazy: true }] : null,
        ].filter(Boolean),
    }
}
