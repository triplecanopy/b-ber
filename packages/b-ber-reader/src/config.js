const localConfig = (_ => {
    if (/^localhost/.test(window.location.host) === false) return {}
    let _config = {}
    try {
        _config = require('../.localconfig') // eslint-disable-line global-require
    }
    catch (err) {
        //
    }
    return _config
})()

module.exports = {
    debug: false,
    verboseOutput: false,
    mobileViewportMaxWidth: 960,
    ...localConfig,
}
