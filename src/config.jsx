
import YAML from 'yamljs'
import path from 'path'
import fs from 'fs-extra'
import actions from './state'

const cwd = process.cwd()

class Configuration {
  constructor() {
    this.config = null
    this.metadata = null
  }

  set metadata(data) {
    this._metadata = data
  }

  get metadata() {
    return this._metadata
  }

  get config() {
    return this._config
  }

  set config(data) {
    this._config = data
  }

  get bber() {
    return {
      ...this.config,
      metadata: this.metadata,
      sample: this.fileOrDefaults('sample'),
      epub: this.fileOrDefaults('epub'),
      mobi: this.fileOrDefaults('mobi'),
      pdf: this.fileOrDefaults('pdf'),
      web: this.fileOrDefaults('web')
    }
  }

  loadSettings() {
    return new Promise((resolve/* , reject */) => {
      const defaults = {
        src: '_book',
        dist: 'book',
        reader: 'https://codeload.github.com/triplecanopy/b-ber-boiler/zip/master'
      }

      try {
        if (fs.statSync(path.join(cwd, 'config.yml'))) {
          this._config = Object.assign(defaults, YAML.load('./config.yml'))
        }
      } catch (e) {
        this._config = defaults
      }

      try {
        if (fs.statSync(path.join(cwd, 'package.json'))) {
          const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
          const { version } = pkg
          this._config.version = version
        }
      } catch (e) {
        //
      }


      resolve()
    })
  }

  loadMetadata() {
    return new Promise((resolve/* , reject */) => {
      const fpath = path.join(cwd, this.config.src, 'metadata.yml')
      try {
        if (fs.statSync(fpath)) {
          this._metadata = YAML.load(fpath)
        }
      } catch (err) {
        this._metadata = []
      }
      resolve()
    })
  }

  fileOrDefaults(type) {
    const buildConfig = { src: this.config.src, dist: `${this.config.dist}-${type}`, pageList: [] }
    const fpath = path.join(cwd, this.config.src, `${type}.yml`)
    try {
      if (fs.statSync(fpath)) {
        Object.assign(buildConfig, { pageList: YAML.load(fpath) })
      }
    } catch (err) {
      return buildConfig
    }
    return buildConfig
  }
}


let conf
const loader = (callback) => {
  if (!conf || !(conf instanceof Configuration)) {
    conf = new Configuration()
    return conf.loadSettings()
      .then(() => conf.loadMetadata())
      .then(() => {
        const { bber } = conf
        actions.setBber({ bber })
        return callback(conf)
      })
  }
  return callback(conf)
}


export default loader
