
import YAML from 'yamljs'
import fs from 'fs'
import { extend } from 'lodash'

const settings = (() => {
  const res = { src: '_book', dist: 'book' }
  try {
    if (fs.statSync('./config.yml')) {
      extend(YAML.load('./config.yml'), res)
    }
  } catch (e) {
    return res
  }
  return res
})()


// b-ber-boiler zip package may not be possible to load directly from GitHub,
// as .git directories are expanded by the unzipper and basically mess
// everything up.  We'll likely have to host a zipped version using `zip -r b
// -ber-boiler.zip ./ -x *.DS_Store -x *.git*` that's packaged on a server
// somewehre. Maybe output from a build task that's then hosted in the bber-
// boiler repo?

// settings.gomez = 'https://github.com/triplecanopy/b-ber-boiler/archive/master.zip'
settings.gomez = 'http://local.static/b-ber-boiler.zip'

export default settings
