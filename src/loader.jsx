
import Configuration from './modules/config'
import actions from './state'

let config

/**
 * Initialize the {@link module:config#Configuration} promise chain
 * @param {module:cli.initialize} callback
 */
const loader = (callback) => {
  if (!config || !(config instanceof Configuration)) {
    config = new Configuration()
    return config.loadSettings()
      .then(() => config.loadMetadata())
      .then(() => {
        const env = process.env.NODE_ENV
        if (env === 'test') { // for unit testing
          config._config.env = env
        }
        const { bber } = config
        actions.setBber({ bber })
        return callback(config)
      })
  }
  return callback(config)
}

/**
 * Callback displayed as module:cli.initialize
 * @callback module:cli.callback
 * @return {}
 */

export default loader
