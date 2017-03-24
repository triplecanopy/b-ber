
/**
 * @module loader
 */

import Configuration from 'bber-lib/config'
import store from 'bber-lib/store'

let config

/**
 * Initialize {@link module:config#Configuration}
 * @param {Function} callback Function to execute after modules load
 * @return {Function} Executes callback
 */
const loader = (callback) => {
  config = new Configuration()
  config.loadSettings()
  config.loadMetadata()
  const { bber } = config
  config._config.env = process.env.NODE_ENV
  store.merge('bber', bber)
  return callback && typeof callback === 'function' ? callback(config) : config
}

/**
 * Callback displayed as module:cli.initialize
 * @callback module:cli.callback
 * @return {Object}
 */

export default loader
