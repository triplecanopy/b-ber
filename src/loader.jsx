
import Configuration from './modules/config'
import actions from './state'

let conf

/**
 * Initialize the {@link module:config#Configuration} promise chain
 * @param {module:cli.initialize} callback
 */
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

/**
 * Callback displayed as module:cli.initialize
 * @callback module:cli.callback
 * @return {}
 */

export default loader
