const localConfig = (() => {
  let _config = {}
  if (/^localhost/.test(window.location.host) === false) return _config

  try {
    // eslint-disable-next-line global-require
    _config = require('../.localconfig')

    // eslint-disable-next-line no-shadow
  } catch (_) {
    // noop
  }
  return _config
})()

module.exports = {
  debug: false, // Colorizes elements. Useful for work on spreads/markers
  showBreakoints: false, // Show breakpoints debugger
  showGrid: false, // Show grid overlay
  logTime: false, // Show console.time
  useLocalStorage: true, // Load/save data from localStorage
  verboseOutput: false, // Logging level
  ...localConfig, // User options
}
