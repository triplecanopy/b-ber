
import YAML from 'yamljs'
import fs from 'fs-extra'

const options = { src: '_book', dist: 'book' }
const settings = (() => {
  try {
    if (fs.statSync('./config.yml')) {
      Object.assign(options, YAML.load('./config.yml'))
    }
  }
  catch (e) {
    return options
  }
  return options
})()

settings.reader = 'https://codeload.github.com/triplecanopy/b-ber-boiler/zip/master'

export default settings
