import Logger from './Logger'

// The one logger every b-ber package shares. It starts with the defaults; the
// CLI applies the command line's options with `log.configure`.
//
// The only export, so that the CommonJS build is `module.exports = log`,
// which is what every package's `import log from` resolves to
const log = new Logger()

export default log
