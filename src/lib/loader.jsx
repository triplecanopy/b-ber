
import Configuration from 'lib/config'
import store from 'lib/store'

let config

/**
 * Initialize the {@link module:config#Configuration} promise chain
 * @param {module:cli.initialize} callback Function to execute after modules load
 * @returns {Function} Executes callback
 */
const loader = (callback) => {
  config = new Configuration()
  config.loadSettings()
  config.loadMetadata()
  const { bber } = config
  config._config.env = process.env.NODE_ENV
  store.merge('bber', bber)
  return callback(config)
}

/**
 * Callback displayed as module:cli.initialize
 * @callback module:cli.callback
 * @returns {Object}
 */

export default loader
