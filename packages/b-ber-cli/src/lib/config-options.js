// Attributes not currently configurable via the CLI:
// ibooks_specified_fonts   always set to `true`
// autoprefixer_options     no JSON support
// downloads                no JSON support
// ui_options               no JSON support

import fs from 'fs-extra'
import path from 'path'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'

export function withConfigOptions(yargs) {
  return yargs
    .option('env', {
      describe: 'The default build environment',
      type: 'string',
      // default: 'development',
    })
    .option('theme', {
      describe: 'Default theme name',
      type: 'string',
      // default: 'b-ber-theme-serif',
    })
    .option('src', {
      describe: 'The name of the source directory',
      type: 'string',
      // default: 'src',
    })
    .option('dist', {
      describe: 'The name of the dist directory',
      type: 'string',
      // default: 'dist',
    })
    .option('cache', {
      describe: 'Whether to enable caching',
      type: 'boolean',
      // default: false,
    })
    .option('themes_directory', {
      describe:
        'Relative or absolute path to the directory for third-party themes',
      type: 'string',
      // default: './themes',
    })
    .option('ignore', {
      describe: 'Array of files or folders to ignore during the build',
      type: 'array',
      // default: [],
    })
    .option('base_path', {
      describe: 'Base path appended to the URL for the reader build',
      type: 'string',
      // default: '/',
    })
    .option('remote_url', {
      describe: 'URL at which the reader build will be made public',
      type: 'string',
      // default: 'http://localhost:4000/',
    })
    .option('reader_url', {
      describe: 'URL that hosts the assets for the reader reader build',
      type: 'string',
      // default: 'http://localhost:4000/project-reader',
    })
    .option('base_url', {
      describe: 'URL to map assets for the web build',
      type: 'string',
      // default: '',
    })
    .option('bucket_url', {
      describe:
        'The S3 bucket URL where the remote project will be deployed to if hosting on S3',
      type: 'string',
      // default: '',
    })
    .option('private', {
      describe:
        'If the web and reader builds should be discoverable by search engines',
      type: 'boolean',
      // default: false,
    })
    .option('remote_javascripts', {
      describe: 'Remotely hosted JavaScript files for the reader',
      type: 'array',
      // default: [],
    })
    .option('remote_stylesheets', {
      describe: 'Remotely hosted stylesheets files for the reader',
      type: 'array',
      // default: [],
    })
    .option('config', {
      describe:
        'Path to a JSON or YAML configuration file that will extend the base configuration',
      type: 'string',
      // default: '',
    })
}

export const blacklistedConfigOptions = new Set([
  'ibooks_specified_fonts',
  'autoprefixer_options',
  'downloads',
  'ui_options',
])

export const parseConfigFile = async configFile => {
  const ext = path.extname(configFile)
  const configPath = path.resolve(process.cwd(), configFile)

  if (!(await fs.pathExists(configPath))) {
    log.error(`Could not find config at [${configPath}]`)
  }

  if (/^\.(?:ya?ml|json)/i.test(ext) === false) {
    log.error('Config file must have a .json or .yaml/.yml file extension')
  }

  const contents = await fs.readFile(configPath)

  if (/^\.ya?ml/i.test(ext)) return YamlAdaptor.parse(contents)

  return JSON.parse(contents)
}
