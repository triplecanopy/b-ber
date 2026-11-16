/**
 * @jest-environment node
 */

// The root Jest run uses jsdom for every package. dart-sass cannot touch the
// file system from inside jsdom's realm: it does not recognise Node's `fs`
// module, whose prototype comes from another realm, and every `@import`
// fails with "Null check operator used on a null value". So this file runs in
// Node, as the task does.

// Tests for the `sass` task. These compile real SCSS with the real dart-sass
// and run the real autoprefixer, against fixture themes and projects written
// to temp directories. Only `State` (a config-loading singleton) and the
// logger are replaced.

import os from 'node:os'
import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import { returnReportedErrors } from './helpers/log'

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => returnReportedErrors(log))

// The parts of `State` the task reads. Paths are rebuilt per test in
// `beforeEach`, everything else is reset there.
const mockState = {
  config: {},
  build: 'epub',
  env: 'development',
  hash: 'test-hash',
  theme: { name: '', entry: '' },
  srcDir: '',
  distDir: '',
  src: {
    root: (...args) => path.join(mockState.srcDir, ...args),
    stylesheets: (...args) =>
      path.join(mockState.srcDir, '_stylesheets', ...args),
  },
  dist: {
    stylesheets: (...args) =>
      path.join(mockState.distDir, 'OPS', 'stylesheets', ...args),
  },
}

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => mockState)

const dartSass = require('sass')

// Required, not imported, so it loads after `mockState` is initialised: the
// task reads `state.config` at module load
const sass = require('../src/sass').default

const THEME_NAME = 'fixture-theme'

let tmp
let themeDir

// Writes `files` (relative path → contents) under `dir`
const writeFiles = (dir, files) =>
  Promise.all(
    Object.entries(files).map(([file, contents]) =>
      fs.outputFile(path.join(dir, file), contents)
    )
  )

const writeTheme = (files) => writeFiles(themeDir, files)

// The user's per-theme customization directory, `_stylesheets/<theme>/`
const writeUserStylesheets = (files) =>
  writeFiles(mockState.src.stylesheets(THEME_NAME), files)

const readCSS = (fileName = 'application.css') =>
  fs.readFile(mockState.dist.stylesheets(fileName), 'utf8')

// Strips whitespace so assertions do not depend on the output style
const squash = (css) => css.replace(/\s+/g, '')

// Spies on `render` and returns a getter for the options the task passed it,
// so the importer can be exercised directly
const captureRenderOptions = () => {
  const spy = jest.spyOn(dartSass, 'render')
  return () => spy.mock.calls[0][0]
}

// Calls the task's importer for `url` and returns what it hands to `done`
const runImporter = (options, url) => {
  let result
  options.importer(url, 'stdin', (value) => {
    result = value
  })
  return result
}

// dart-sass prints deprecation warnings straight to stderr: for the legacy JS
// API this task calls, and for the built-in themes' `@import`s and global
// functions. They are expected here and would bury the test output
const writeStderr = process.stderr.write.bind(process.stderr)
const isSassDeprecation = (chunk) =>
  /DEPRECATION WARNING|^WARNING: (Deprecated|\d+ repetitive deprecation)/.test(
    String(chunk)
  )

beforeEach(async () => {
  jest
    .spyOn(process.stderr, 'write')
    .mockImplementation((chunk, ...rest) =>
      isSassDeprecation(chunk) ? true : writeStderr(chunk, ...rest)
    )

  // realpath because macOS's tmpdir is a symlink, and `require.resolve`
  // returns real paths
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-sass-'))
  )
  themeDir = path.join(tmp, 'themes', THEME_NAME)

  mockState.config = {}
  mockState.build = 'epub'
  mockState.env = 'development'
  mockState.hash = 'test-hash'
  mockState.srcDir = path.join(tmp, '_project')
  mockState.distDir = path.join(tmp, 'project-epub')
  mockState.theme = {
    name: THEME_NAME,
    entry: path.join(themeDir, 'application.scss'),
  }

  jest.clearAllMocks()
})

afterEach(async () => {
  jest.restoreAllMocks()
  await fs.remove(tmp)
})

describe('task: sass', () => {
  describe('concatenation', () => {
    test('joins user settings, the theme entry and user overrides, in that order', async () => {
      await writeTheme({
        'application.scss':
          '/* theme */\n$color: blue !default;\n.title { color: $color; }\n',
      })
      await writeUserStylesheets({
        '_settings.scss': '/* settings */\n',
        '_overrides.scss': '/* overrides */\n',
      })

      await sass()
      const css = await readCSS()

      const settings = css.indexOf('/* settings */')
      const theme = css.indexOf('/* theme */')
      const overrides = css.indexOf('/* overrides */')

      expect(settings).toBeGreaterThanOrEqual(0)
      expect(theme).toBeGreaterThan(settings)
      expect(overrides).toBeGreaterThan(theme)
    })

    test('user settings take precedence over the theme’s `!default` variables', async () => {
      await writeTheme({
        'application.scss':
          '$color: blue !default;\n.title { color: $color; }\n',
      })
      await writeUserStylesheets({ '_settings.scss': '$color: red;\n' })

      await sass()

      expect(squash(await readCSS())).toContain('.title{color:red;}')
    })

    test('user overrides come after the theme’s rules, so they win the cascade', async () => {
      await writeTheme({ 'application.scss': '.title { color: blue; }\n' })
      await writeUserStylesheets({
        '_overrides.scss': '.title { color: green; }\n',
      })

      await sass()
      const css = squash(await readCSS())

      expect(css.indexOf('.title{color:green;}')).toBeGreaterThan(
        css.indexOf('.title{color:blue;}')
      )
    })

    test('the theme’s variables are in scope in user overrides', async () => {
      await writeTheme({ 'application.scss': '$accent: #f00 !default;\n' })
      await writeUserStylesheets({
        '_overrides.scss': '.link { color: $accent; }\n',
      })

      await sass()

      expect(squash(await readCSS())).toContain('.link{color:#f00;}')
    })

    test('compiles without a user `_settings.scss`', async () => {
      await writeTheme({ 'application.scss': '.theme { color: blue; }\n' })
      await writeUserStylesheets({
        '_overrides.scss': '.overrides { color: green; }\n',
      })

      await sass()
      const css = squash(await readCSS())

      expect(css).toContain('.theme{color:blue;}')
      expect(css).toContain('.overrides{color:green;}')
      expect(log.error).not.toHaveBeenCalled()
    })

    test('compiles without a user `_overrides.scss`', async () => {
      await writeTheme({
        'application.scss':
          '$color: blue !default;\n.theme { color: $color; }\n',
      })
      await writeUserStylesheets({ '_settings.scss': '$color: red;\n' })

      await sass()

      expect(squash(await readCSS())).toContain('.theme{color:red;}')
      expect(log.error).not.toHaveBeenCalled()
    })

    test('compiles the theme alone when the user has no stylesheets', async () => {
      await writeTheme({ 'application.scss': '.theme { color: blue; }\n' })

      await sass()

      expect(squash(await readCSS())).toBe('.theme{color:blue;}')
      expect(log.error).not.toHaveBeenCalled()
    })

    test('only reads user stylesheets from the selected theme’s directory', async () => {
      await writeTheme({ 'application.scss': '.theme { color: blue; }\n' })
      await writeFiles(mockState.src.stylesheets('another-theme'), {
        '_overrides.scss': '.other { color: green; }\n',
      })

      await sass()

      expect(squash(await readCSS())).not.toContain('.other')
    })

    test('silently compiles only the user stylesheets when the theme entry is missing', async () => {
      // Current behaviour: a theme whose entry file does not exist is skipped
      // without a warning, as long as one of the user files exists
      await writeUserStylesheets({
        '_overrides.scss': '.overrides { color: green; }\n',
      })

      await sass()

      expect(squash(await readCSS())).toBe('.overrides{color:green;}')
      expect(log.error).not.toHaveBeenCalled()
    })

    test('reports an error when there is nothing to compile', async () => {
      await expect(sass()).rejects.toThrow('No readable stylesheets were found')

      expect(log.error).toHaveBeenCalledWith(
        'No readable stylesheets were found'
      )
      expect(fs.existsSync(mockState.dist.stylesheets('application.css'))).toBe(
        false
      )
    })
  })

  describe('$build', () => {
    // The build names `b-ber-shapes-sequences` defines; `b-ber-cli` sets
    // `state.build` to each in turn, and every sequence runs `sass`
    test.each(['epub', 'mobi', 'pdf', 'web', 'sample', 'reader', 'xml'])(
      'declares `$build: "%s"` for the %s build',
      async (build) => {
        mockState.build = build
        await writeTheme({
          'application.scss': '.build::after { content: "#{$build}"; }\n',
        })

        await sass()

        expect(squash(await readCSS())).toContain(
          `.build::after{content:"${build}";}`
        )
      }
    )

    test('overrides the theme’s own `$build: … !default`', async () => {
      mockState.build = 'reader'
      await writeTheme({
        'application.scss': [
          "$build: 'epub' !default;",
          "@if $build == 'reader' { .reader { display: block; } }",
          "@if $build == 'epub' { .epub { display: block; } }",
          '',
        ].join('\n'),
      })

      await sass()
      const css = squash(await readCSS())

      expect(css).toContain('.reader{display:block;}')
      expect(css).not.toContain('.epub')
    })

    test('is declared before the user settings, so they can branch on it', async () => {
      mockState.build = 'web'
      await writeTheme({
        'application.scss':
          '$color: blue !default;\n.title { color: $color; }\n',
      })
      // `$color` is declared at the root first: user settings come before the
      // theme, so nothing has declared it yet, and an assignment inside `@if`
      // to an undeclared variable is local to that block
      await writeUserStylesheets({
        '_settings.scss':
          "$color: red;\n@if $build == 'web' { $color: purple; }\n",
      })

      await sass()

      expect(squash(await readCSS())).toContain('.title{color:purple;}')
    })

    test('is declared as the first statement of the compiled source', async () => {
      const getOptions = captureRenderOptions()
      mockState.build = 'mobi'
      await writeTheme({ 'application.scss': '.theme { color: blue; }\n' })
      await writeUserStylesheets({ '_settings.scss': '$color: red;\n' })

      await sass()

      expect(getOptions().data).toBe(
        '$build: "mobi";$color: red;\n.theme { color: blue; }\n'
      )
    })
  })

  describe('import resolution', () => {
    // A package in a `node_modules` above the theme directory, which is where
    // the importer starts looking
    const writePackage = (name, files) =>
      writeFiles(path.join(tmp, 'node_modules', name), {
        'package.json': JSON.stringify({ name, main: 'index.js' }),
        'index.js': '',
        ...files,
      })

    test('resolves `~@scope/package/file` to a file in that package', async () => {
      await writePackage('@fixture/mixins', {
        '_colors.scss': '$brand: #0a0;\n',
      })
      await writeTheme({
        'application.scss':
          "@import '~@fixture/mixins/colors';\n.brand { color: $brand; }\n",
      })

      await sass()

      expect(squash(await readCSS())).toContain('.brand{color:#0a0;}')
    })

    test('resolves `~package/file` for an unscoped package', async () => {
      await writePackage('fixture-mixins', {
        'stylesheets/_space.scss': '$gap: 3px;\n',
      })
      await writeTheme({
        'application.scss':
          "@import '~fixture-mixins/stylesheets/space';\n.gap { margin: $gap; }\n",
      })

      await sass()

      expect(squash(await readCSS())).toContain('.gap{margin:3px;}')
    })

    test('resolves a bare `~package` to the package’s `main`', async () => {
      await writeFiles(path.join(tmp, 'node_modules', 'fixture-scss-main'), {
        'package.json': JSON.stringify({
          name: 'fixture-scss-main',
          main: '_index.scss',
        }),
        '_index.scss': '.from-main { color: teal; }\n',
      })
      await writeTheme({
        'application.scss': "@import '~fixture-scss-main';\n",
      })

      await sass()

      expect(squash(await readCSS())).toContain('.from-main{color:teal;}')
    })

    test('resolves packages from the theme’s directory', async () => {
      const getOptions = captureRenderOptions()
      await writePackage('@fixture/mixins', {})
      await writeTheme({ 'application.scss': '' })

      await sass()

      expect(runImporter(getOptions(), '~@fixture/mixins/colors')).toEqual({
        file: path.join(tmp, 'node_modules', '@fixture', 'mixins', 'colors'),
      })
    })

    test('passes imports without a tilde through unchanged', async () => {
      const getOptions = captureRenderOptions()
      await writeTheme({ 'application.scss': '' })

      await sass()

      expect(runImporter(getOptions(), 'layout/text')).toEqual({
        file: 'layout/text',
      })
    })

    test('builds a wrong path when the package name also appears earlier in the path', async () => {
      // DEFECT (#774): `resolveImportedModule` finds the package directory with
      // `modulePath.indexOf(moduleName)`, the *first* occurrence of the name in
      // the resolved path. When a directory above `node_modules` contains the
      // name, the path is cut short there. Here the project lives in
      // `fixture-mixins-project/`, so `~fixture-mixins/space` resolves inside
      // `<tmp>/fixture-mixins/` instead of the package
      const getOptions = captureRenderOptions()
      const project = path.join(tmp, 'fixture-mixins-project')
      await writeFiles(path.join(project, 'node_modules', 'fixture-mixins'), {
        'package.json': JSON.stringify({ name: 'fixture-mixins' }),
        'index.js': '',
      })
      await writeFiles(path.join(project, 'theme'), { 'application.scss': '' })
      mockState.theme.entry = path.join(project, 'theme', 'application.scss')

      await sass()

      const { file } = runImporter(getOptions(), '~fixture-mixins/space')
      expect(file).toBe(path.join(tmp, 'fixture-mixins', 'space'))
      expect(file).not.toBe(
        path.join(project, 'node_modules', 'fixture-mixins', 'space')
      )
    })

    test('finds partials in the theme directory and in `_stylesheets/`', async () => {
      await writeTheme({
        'application.scss': "@import 'theme-partial';\n",
        '_theme-partial.scss': '.theme-partial { color: blue; }\n',
      })
      await writeFiles(mockState.src.stylesheets(), {
        '_project-partial.scss': '.project-partial { color: green; }\n',
      })
      await writeUserStylesheets({
        '_overrides.scss': "@import 'project-partial';\n",
      })

      await sass()
      const css = squash(await readCSS())

      expect(css).toContain('.theme-partial{color:blue;}')
      expect(css).toContain('.project-partial{color:green;}')
    })

    test('a partial in `_stylesheets/` shadows the theme’s partial of the same name', async () => {
      // `_stylesheets/` is the first include path, and the theme entry is
      // compiled as a string rather than from its own file, so its imports are
      // looked up there before the theme's directory
      await writeTheme({
        'application.scss': "@import 'settings';\n.title { color: $color; }\n",
        '_settings.scss': '$color: blue;\n',
      })
      await writeFiles(mockState.src.stylesheets(), {
        '_settings.scss': '$color: orange;\n',
      })

      await sass()

      expect(squash(await readCSS())).toContain('.title{color:orange;}')
    })
  })

  describe('built-in themes', () => {
    const useBuiltInTheme = (name) => {
      mockState.theme = require(`@canopycanopycanopy/${name}`)
    }

    test('compiles b-ber-theme-serif, resolving its `~` imports', async () => {
      useBuiltInTheme('b-ber-theme-serif')

      await sass()
      const css = await readCSS()

      expect(css.length).toBeGreaterThan(1000)
      expect(log.error).not.toHaveBeenCalled()
    })

    test('emits b-ber-theme-serif’s reader rules only for the reader build', async () => {
      useBuiltInTheme('b-ber-theme-serif')
      // `layout/_reader.scss` loads this font stylesheet inside
      // `@if $build == 'reader'`
      const readerOnly = 'fast.fonts.net'

      mockState.build = 'reader'
      await sass()
      expect(await readCSS()).toContain(readerOnly)

      mockState.build = 'epub'
      await sass()
      expect(await readCSS()).not.toContain(readerOnly)
    })

    test('compiles b-ber-theme-sans, which imports b-ber-theme-serif’s partials', async () => {
      useBuiltInTheme('b-ber-theme-sans')
      await writeFiles(mockState.src.stylesheets('b-ber-theme-sans'), {
        '_settings.scss': '$font-sans: "Fixture Sans", sans-serif;\n',
      })

      await sass()

      expect(await readCSS()).toContain('"Fixture Sans"')
      expect(log.error).not.toHaveBeenCalled()
    })

    test('b-ber-theme-serif resets a user’s `$font-family-base` in the reader build', async () => {
      // The theme's `_settings.scss` assigns `$font-family-base` without
      // `!default` inside `@if $build == 'reader'`. It is imported after the
      // user's settings, so the user's value holds in every build but reader
      useBuiltInTheme('b-ber-theme-serif')
      await writeFiles(mockState.src.stylesheets('b-ber-theme-serif'), {
        '_settings.scss': '$font-family-base: "Fixture Face", serif;\n',
      })

      mockState.build = 'epub'
      await sass()
      expect(await readCSS()).toContain('"Fixture Face"')

      mockState.build = 'reader'
      await sass()
      expect(await readCSS()).not.toContain('"Fixture Face"')
    })
  })

  describe('autoprefixer', () => {
    test('adds vendor prefixes to the compiled CSS', async () => {
      await writeTheme({ 'application.scss': '.a { user-select: none; }\n' })

      await sass()

      expect(squash(await readCSS())).toContain('-webkit-user-select:none;')
    })

    test('uses `autoprefixer_options` from the config', async () => {
      mockState.config = {
        autoprefixer_options: { overrideBrowserslist: ['ie 10'] },
      }
      await writeTheme({ 'application.scss': '.b { display: flex; }\n' })

      // The options are read when the module loads, so load a fresh copy
      let isolatedSass
      jest.isolateModules(() => {
        isolatedSass = require('../src/sass').default
      })
      await isolatedSass()

      expect(squash(await readCSS())).toContain('display:-ms-flexbox;')
    })

    test('ignores `autoprefixer_options` set after the module has loaded', async () => {
      // Current behaviour: the options are captured once, at import
      mockState.config = {
        autoprefixer_options: { overrideBrowserslist: ['ie 10'] },
      }
      await writeTheme({ 'application.scss': '.b { display: flex; }\n' })

      await sass()

      expect(squash(await readCSS())).not.toContain('-ms-flexbox')
    })
  })

  describe('output', () => {
    test('writes expanded CSS to `application.css` in development', async () => {
      await writeTheme({ 'application.scss': '.a { color: red; }\n' })

      await sass()

      expect(await readCSS()).toBe('.a {\n  color: red;\n}')
    })

    test('writes compressed CSS to `<hash>.css` in production', async () => {
      mockState.env = 'production'
      mockState.hash = 'abc123'
      await writeTheme({ 'application.scss': '.a { color: red; }\n' })

      await sass()

      expect(await readCSS('abc123.css')).toBe('.a{color:red}')
      expect(fs.existsSync(mockState.dist.stylesheets('application.css'))).toBe(
        false
      )
    })
  })

  describe('theme assets', () => {
    test('copies the theme’s fonts and images into the project, skipping dotfiles', async () => {
      await writeTheme({
        'application.scss': '',
        'fonts/body.woff2': 'font',
        'fonts/.DS_Store': 'junk',
        'images/texture.png': 'image',
      })

      await sass()

      expect(await fs.readdir(mockState.src.root('_fonts'))).toEqual([
        'body.woff2',
      ])
      expect(await fs.readdir(mockState.src.root('_images'))).toEqual([
        'texture.png',
      ])
    })

    test('does not overwrite assets already in the project', async () => {
      await writeTheme({ 'application.scss': '', 'fonts/body.woff2': 'theme' })
      await writeFiles(mockState.src.root('_fonts'), { 'body.woff2': 'user' })

      await sass()

      expect(
        await fs.readFile(mockState.src.root('_fonts', 'body.woff2'), 'utf8')
      ).toBe('user')
    })

    test('creates `_fonts` and `_images` when the theme has neither', async () => {
      await writeTheme({ 'application.scss': '' })

      await sass()

      expect(fs.existsSync(mockState.src.root('_fonts'))).toBe(true)
      expect(fs.existsSync(mockState.src.root('_images'))).toBe(true)
    })
  })

  describe('errors', () => {
    // Runs the real `render`, but calls the task's callback inside a
    // try/catch, so a throw from it is captured instead of becoming an
    // uncaught exception. `thrown` resolves with what it threw, or undefined
    const trapRenderCallback = () => {
      const { render } = dartSass
      let done
      const thrown = new Promise((resolve) => {
        done = resolve
      })

      jest.spyOn(dartSass, 'render').mockImplementation((options, callback) =>
        render(options, (err, result) => {
          try {
            callback(err, result)
            done(undefined)
          } catch (error) {
            done(error)
          }
        })
      )

      return { thrown }
    }

    test('passes a failed asset copy to the logger', async () => {
      // DEFECT (#774): `copyThemeAssets` calls `lstatSync(themePath).isDirectory()`
      // and discards the result, so a theme `fonts` or `images` that is a file
      // is not skipped. `readdirSync` then fails with ENOTDIR and the build
      // stops
      await writeTheme({ 'application.scss': '', fonts: 'not a directory' })

      await expect(sass()).rejects.toMatchObject({ code: 'ENOTDIR' })

      expect(log.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ENOTDIR' })
      )
    })

    const runAsRoot = process.getuid?.() === 0

    // root can stat anything, so the permission error cannot be produced
    ;(runAsRoot ? test.skip : test)(
      'wraps an unreadable theme asset directory in a descriptive error',
      async () => {
        await writeTheme({ 'application.scss': '' })
        await fs.chmod(themeDir, 0o000)

        try {
          await expect(sass()).rejects.toThrow('There was a problem copying')
        } finally {
          await fs.chmod(themeDir, 0o755)
        }

        expect(log.error).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('There was a problem copying'),
          })
        )
      }
    )

    test('a compile error is thrown from the render callback and never reaches the logger', async () => {
      // DEFECT (#773): `renderCSS` does `if (err) throw err` inside dart-sass's
      // asynchronous callback. The throw escapes the Promise it is wrapped in,
      // so it becomes an uncaught exception, the task's Promise never settles,
      // and the task's `.catch` never sees it. Under the CLI, its
      // uncaught-exception handler prints it and exits; any other caller is
      // left waiting on a Promise that never settles. The trap observes the
      // throw without crashing the test process
      const trap = trapRenderCallback()

      await writeTheme({ 'application.scss': '.a { color: $undefined; }\n' })

      let settled = false
      sass().then(
        () => {
          settled = true
        },
        () => {
          settled = true
        }
      )

      const thrown = await trap.thrown
      // Let any settlement the throw might have caused run first
      await new Promise((resolve) => setImmediate(resolve))

      expect(thrown).toBeInstanceOf(Error)
      expect(thrown.message).toContain('Undefined variable')
      expect(settled).toBe(false)
      expect(log.error).not.toHaveBeenCalled()
    })

    test('an import of a missing package fails the same way', async () => {
      // The importer's `require.resolve` throws; dart-sass reports it as a
      // compile error, which hits the same uncaught throw as above
      const trap = trapRenderCallback()

      await writeTheme({
        'application.scss': "@import '~@fixture/not-installed/file';\n",
      })

      sass()
      const thrown = await trap.thrown

      expect(thrown).toBeInstanceOf(Error)
      expect(thrown.message).toContain('@fixture/not-installed')
      expect(log.error).not.toHaveBeenCalled()
    })
  })
})
