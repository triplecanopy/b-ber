
import YAML from 'yamljs'
import fs from 'fs-extra'

const options = { src: '_book', dist: 'book' }
const settings = (() => {
  try {
    if (fs.statSync('./config.yml')) {
      Object.assign(options, YAML.load('./config.yml'))
    }
  } catch (e) {
    return options
  }
  return options
})()


// b-ber-boiler zip package may not be possible to load directly from GitHub,
// as .git directories are expanded by the unzipper and basically mess
// everything up.  We'll likely have to host a zipped version using `zip -r b
// -ber-boiler.zip ./ -x *.DS_Store -x *.git*` that's packaged on a server
// somewehre. Maybe output from a build task that's then hosted in the bber-
// boiler repo?

settings.gomez = 'http://maxwellsimmer.com/b-ber-boiler.zip'

export default settings
