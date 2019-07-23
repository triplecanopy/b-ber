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
    debug: false, // 'colorizes' elements. useful for work on spreads/markers
    showBreakoints: false, // show breakpoints debugger
    showGrid: false, // show grid overlay
    logTime: false, // show console.time
    useLocalStorage: true, // load/save data from localStorage
    verboseOutput: false, // log level
    ...localConfig, // user opts
}
