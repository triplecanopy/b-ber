import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import autoprefixer from 'autoprefixer'
import fs from 'fs-extra'
import postcss from 'postcss'
import dartSass from 'sass'
import { dist, env, src } from '../context'

// dart-sass writes its warnings straight to stderr, where they bury the
// build's own output: a build of either bundled theme prints dozens of
// deprecation warnings that only b-ber can act on. Deprecations, and the
// count of those dart-sass leaves out, go to the verbose output; a `@warn` in
// a stylesheet is a warning
const OMITTED_DEPRECATIONS = /repetitive deprecation warnings omitted/

const sassLogger = {
  warn(message: string, { deprecation }: { deprecation: boolean }) {
    if (deprecation || OMITTED_DEPRECATIONS.test(message)) {
      log.info('sass deprecation: %s', message)
    } else {
      log.warn('sass %s', message)
    }
  },
  debug(message: string) {
    log.info('sass %s', message)
  },
}

// dirnames that may be referenced in the theme. we copy over assets when
// running the sass task
const ASSET_DIRNAMES = ['fonts', 'images']

// config.yml's `autoprefixer_options`, read when the task runs. It used to
// be read from State when the module was imported, so a target's section of
// config.yml and the command line could not change it (TASK-162's bug 4)
const autoprefixerOptions = (ctx: BuildContext) =>
  ctx.config.autoprefixer_options || {
    overrideBrowserslist: ['defaults', '> 1%', 'not dead', 'not IE 11'],
    flexbox: 'no-2009',
  }

// Check to see if there's an `application.scss` in `_stylesheets`, and if so
// load that; else verify that a theme is selected in `config`, and that the
// theme's `application.scss` exists, then load that; else write a blank file.
const createSCSSString = (ctx: BuildContext) => {
  const chunks = []
  const { theme } = ctx.project
  const themeName = theme.name

  const themeSettingsPath = src(ctx).stylesheets(themeName, '_settings.scss')
  const themeOverridesPath = src(ctx).stylesheets(themeName, '_overrides.scss')
  const themeStylesPath = theme.entry

  // load user-defined variables
  if (fs.existsSync(themeSettingsPath)) {
    const variableOverrides = fs.readFileSync(themeSettingsPath)
    log.info(`sass use overrides [${path.basename(themeSettingsPath)}]`)
    log.info('sass prepend overrides')
    chunks.push(variableOverrides)
  }

  // load theme styles
  if (fs.existsSync(themeStylesPath)) {
    const themeStyles = fs.readFileSync(themeStylesPath)
    log.info(`sass attempt build with [${themeName}] theme`)
    chunks.push(themeStyles)
  }

  // load user-defined styles
  if (fs.existsSync(themeOverridesPath)) {
    const styleOverrides = fs.readFileSync(themeOverridesPath)
    log.info(
      `sass use user-defined styles [${path.basename(themeOverridesPath)}]`
    )
    log.info('sass append user-defined styles')
    chunks.push(styleOverrides)
  }

  if (chunks.length < 1) throw log.error('No readable stylesheets were found')

  return Buffer.concat(chunks)
}

// make sure the compiled output dir exists
const ensureCSSDir = (ctx: BuildContext) => fs.mkdirp(dist(ctx).stylesheets())

// copy assets that exist in theme directory to the corresponding directory in
// _project:
//
// my-theme/fonts/my-font.ttf    -> _project/_fonts/my-font.ttf
// my-theme/images/my-image.jpg  -> _project/_images/my-image.jpg
//
// if the asset already exists in the _project dir, it is *not* overwritten.
//
// these assets are then copied to the correct build dir by the `copy` task.
//
const copyThemeAssets = (ctx: BuildContext) => {
  const { theme } = ctx.project

  const fileData = ASSET_DIRNAMES.reduce(
    (acc, curr) => {
      const themePath = path.resolve(path.dirname(theme.entry), curr)
      const srcPath = src(ctx).root(`_${curr}`)

      fs.mkdirpSync(srcPath)

      try {
        fs.lstatSync(themePath).isDirectory()
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return acc
        throw new Error(
          `There was a problem copying [${themePath}] to [${srcPath}]`
        )
      }

      const data = fs
        .readdirSync(themePath)
        .filter((a) => a.charAt(0) !== '.')
        .map((fileName) => ({
          input: path.join(themePath, fileName),
          output: path.join(srcPath, fileName),
        }))

      return acc.concat(data)
    },
    [] as { input: string; output: string }[]
  )

  const promises = fileData.map(({ input, output }) =>
    fs.copy(input, output, {
      overwrite: false,
      errorOnExist: false,
    })
  )

  return Promise.all(promises)
}

function resolveImportedModule(ctx: BuildContext, importPath: string) {
  // Remove preceeding tilde
  const trimmedImportPath = importPath.slice(1)

  // Get the import path as an array
  let importTree = trimmedImportPath.split(path.sep)

  // Remove empty entries caused by leading/trailing slashes
  importTree = importTree.filter(Boolean)

  // Define both the scope and the name - the scope will be
  // used to resolve the import and get the necessary path, the
  // name will be used to construct the final file path
  let moduleScope = ''
  let moduleName = importTree.shift()!

  // Allow scoped packages
  if (moduleName[0] === '@') {
    moduleScope = moduleName
    moduleName = importTree.shift()!
  }

  // @foo/bar | foo
  const moduleNameWithScope = path.join(moduleScope, moduleName)

  // Get the module
  const modulePath = require.resolve(moduleNameWithScope, {
    paths: [path.join(path.dirname(ctx.project.theme.entry))],
  })

  // No path was provided, return the imported node module
  if (!importTree.length) return modulePath

  // User is importing a specific file, find it and return its location. Remove
  // the modules scope from the name when finding the path
  const moduleIndex = modulePath.indexOf(moduleName) + moduleName.length
  const packagePath = modulePath.slice(0, moduleIndex)
  const importedModule = path.join(packagePath, ...importTree)

  return importedModule
}

const renderCSS = (
  ctx: BuildContext,
  scssString: Buffer
): Promise<{ css: Buffer }> =>
  new Promise((resolve) => {
    const { theme } = ctx.project
    dartSass.render(
      {
        // Importer allows use of '~' to denote node_modules directory in SCSS files
        importer: (url, _file, done) => {
          const file = url[0] === '~' ? resolveImportedModule(ctx, url) : url

          return done({ file })
        },

        // Add build vars at runtime with the SCSS buffer (which is transformed
        // to string in the backticks)
        // `$build` is the target's name, one of the four places a project
        // sees it (TASK-160)
        data: `$build: "${ctx.target.name}";${scssString}`,

        includePaths: [
          src(ctx).stylesheets(),
          path.dirname(theme.entry),
          path.dirname(path.dirname(theme.entry)),
        ],
        outputStyle: env() === 'production' ? 'compressed' : 'expanded',
        logger: sassLogger,
        // @ts-expect-error `errLogToConsole` is a node-sass option, which
        // dart-sass ignores. Kept so this change is types-only; it can go
        errLogToConsole: true,
      },
      (err, result) => {
        if (err) throw err
        resolve(result as { css: Buffer })
      }
    )
  })

const applyPostProcessing = (ctx: BuildContext, { css }: { css: Buffer }) =>
  postcss(autoprefixer(autoprefixerOptions(ctx))).process(css, {
    from: undefined,
  })

const writeCSSFile = (ctx: BuildContext, { css }: { css: string }) => {
  const fileName =
    env() === 'production' ? `${ctx.hash}.css` : 'application.css'

  return fs.writeFile(dist(ctx).stylesheets(fileName), css)
}

const sass = (ctx: BuildContext) =>
  ensureCSSDir(ctx)
    .then(() => copyThemeAssets(ctx))
    .then(() => createSCSSString(ctx))
    .then((scss) => renderCSS(ctx, scss))
    .then((result) => applyPostProcessing(ctx, result))
    .then((result) => writeCSSFile(ctx, result))
    .catch((err) => {
      throw log.error(err)
    })

export default sass
