/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import fs from 'fs-extra'
import path from 'path'
import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'

const command = 'new <name>'
const describe = 'Create a new project'
const builder = yargs =>
  yargs
    .positional('name', {
      describe: 'New project name',
      type: 'string',
    })

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

    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 new "My Project"\n\n${describe}`)

const handler = async argv => {
  // Extract CLI options and get the config file option in case there is one
  const { _, $0, name, config, ...rest } = argv

  // Set up the config object that's going to be passed into the `init` function
  let projectConfig = {}

  // Check if a config files has been specified
  if (config) {
    const ext = path.extname(config)
    const configPath = path.resolve(process.cwd(), config)

    if (!(await fs.pathExists(config))) {
      log.error('Could not find config at %s', configPath)
    }

    if (/^\.(?:ya?ml|json)/i.test(ext) === false) {
      log.error('Config file must have a .json or .yaml/.yml file extension')
    }

    const contents = await fs.readFile(config)

    if (/^\.ya?ml/i.test(ext)) {
      projectConfig = YamlAdaptor.parse(contents)
    } else {
      projectConfig = JSON.parse(contents)
    }
  }

  // Override the values specified in the config file with values
  // that have been explicitly provided on the CLI. Allows using the
  // config file as a template that can be overridden, e.g.,
  // bber new foo --config my-generic-conf.yaml --base_path /foo
  projectConfig = { ...projectConfig, ...rest }

  // Attributes not currently configurable via the CLI:
  // ibooks_specified_fonts
  // autoprefixer_options
  // base_url
  // downloads
  // ui_options

  const initializer = new Initializer({ name, config: projectConfig })
  initializer.start()
}

export default {
  command,
  describe,
  builder,
  handler,
}
