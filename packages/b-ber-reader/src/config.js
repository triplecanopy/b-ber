const localConfig = (_ => {
    let _config = {}
    if (/^localhost/.test(window.location.host) === false) return _config

    try {
        // eslint-disable-next-line global-require
        _config = require('../.localconfig')
    }
    catch (err) {
        /* noop */
    }
    return _config
})()

module.exports = {
    debug: false, // 'colorizes' elements. useful for work on spreads/markers
    logTime: false, // show console.time
    useLocalStorage: true, // load/save data from localStorage
    verboseOutput: false, // log level
    ...localConfig, // user opts
}
