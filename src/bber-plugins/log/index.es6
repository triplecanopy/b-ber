/* eslint-disable class-methods-use-this, max-len */
import chalk from 'chalk'
import util from 'util'

class Logger {
  constructor() {
    this.logLevel = this._setLogLevel() // info: 0, warning: 1, error: 2, debug: 3
    this.boringOutput = 1
    this.consoleWidth = 70
    this.errors = []
    this.warnings = []
    this.infos = []
  }

  _setLogLevel() {
    if (process.argv.indexOf('--verbose') > -1 || process.env.NODE_ENV === 'debug') {
      return 3
    }

    if (process.env.NODE_ENV === 'production') {
      return 2
    }

    if (process.argv.indexOf('--quiet') > -1) {
      return 0
    }

    return 1
  }

  _colors(location, logStyle) {
    return {
      prefix: ['cyan', 'yellow', 'red', 'grey'][logStyle],
      suffix: ['black', 'black', 'black', 'black'][logStyle],
      statusText: ['cyan', 'yellow', 'whiteBright', 'grey'][logStyle],
      statusBg: ['', '', 'bgRed', ''][logStyle],
      body: ['black', 'black', 'black', 'black'][logStyle],
      accent: [[253, 100, 252], [253, 100, 252], [253, 100, 252], [253, 100, 252]][logStyle], // arrays of rgb values
    }[location]
  }

  _prefix(logStyle) {
    return chalk[this._colors('prefix', logStyle)]([
      '',
      '',
      `[${new Date().toISOString()}]: `,
      `[${new Date().toISOString()}]: `,
    ][this.logLevel])
  }

  _suffix(logStyle) {
    return chalk[this._colors('suffix', logStyle)]([
      '',
      '',
      '',
      '',
    ][this.logLevel])
  }

  _statusTextAndBackground(logStyle) {
    if (this._colors('statusBg', logStyle)) {
      return chalk[this._colors('statusText', logStyle)][this._colors('statusBg', logStyle)]
    }
    return chalk[this._colors('statusText', logStyle)]
  }

  _statusText(logStyle) {
    return [
      this._statusTextAndBackground(logStyle)(`${['🐬  ', 'warning: ', 'error: ', 'debug: '][logStyle]}`),
      this._statusTextAndBackground(logStyle)(`${['info: ', 'warning: ', 'error: ', 'debug: '][logStyle]}`),
    ][this.boringOutput]
  }

  _accentedText(logStyle, args) {
    if (typeof args !== 'string') {
      console.log(args)
      process.exit(0)
    }
    return args.replace(/(\[[^\]]+?\])/g, chalk.rgb(...this._colors('accent', logStyle))('$1'))
  }

  _formatArgs(logStyle, _args) {
    return [
      args => this._accentedText(logStyle, args),
      args => this._accentedText(logStyle, args),
      args => this._accentedText(logStyle, args),
      args => this._accentedText(logStyle, args),
    ][logStyle](_args)
  }

  _composeLog(logStyle, args) {
    return
    if (this.logLevel === 0) { return '' } // for quiet mode
    return console.log(chalk(
      this._statusText(logStyle) +
      this._prefix(logStyle) +
      chalk[this._colors('body', logStyle)](
        this._formatArgs(logStyle, args)
      ) +
      this._suffix(logStyle)
    ))
  }

  _colorExited(strs, exitCode) {
    const str = `${strs[0]}${exitCode}${strs[1]}`
    if (exitCode) {
      return chalk.whiteBright.bgRed(str)
    }

    return str
  }

  _exitIfFatal(stopAndExitWithCode) {
    const stopExecution = typeof stopAndExitWithCode !== 'undefined'
    const exitCode = stopAndExitWithCode
    if (stopExecution) {
      console.log(this._colorExited`bber exited with code [${exitCode}]`)
      process.exit(exitCode)
    }
  }

  _printLog(n, args, stopAndExitWithCode) { // eslint-disable-line consistent-return
    if (process.env.NODE_ENV === 'test') { return }
    if (n <= this.logLevel && n < 2) {
      this._composeLog(n, args)
    } else if (n === 2) { // error
      console.log()
      this._composeLog(n, args.message || args)
      console.error(args.stack || args)
      this._exitIfFatal(stopAndExitWithCode)
    } else if (n === 3) { // debug
      console.log()
      console.log('='.repeat(this.consoleWidth))
      console.log()
      console.log(chalk(this._statusText(n) + this._prefix(n)))
      this.inspect(args)
      console.trace()
      this._exitIfFatal(stopAndExitWithCode)
    }
  }

  // public API
  reset() {
    this.errors = []
    this.warnings = []
    this.infos = []
  }

  debug(args, stopAndExitWithCode) {              // level 3
    this._printLog(3, args, stopAndExitWithCode)
  }

  error(args, stopAndExitWithCode) {              // level 2
    this.errors.push(args)
    this._printLog(2, args, stopAndExitWithCode)
  }
  warn(args) {                                    // level 1
    this.warnings.push(args)
    this._printLog(1, args)
  }
  info(args) {                                    // level 0
    this.infos.push(args)
    this._printLog(0, args)
  }

  trace(err) {
    console.error(err.stack || err)
    process.exit(0)
  }

  inspect(args) {
    return console.log(util.inspect(args, true, null, true))
  }

  summary({ store, formattedStartDate, formattedEndDate, sequenceEnd }) {
    if (process.env.NODE_ENV === 'test') { return }
    const sep = ' '.repeat(3)
    const maxReportingLen = { short: 30, long: 70 }

    console.log('🏖  Done')
    if (this.logLevel === 0) { return }
    if (this.logLevel > 0) {
      console.log(chalk.rgb(188, 174, 169)(`$ ${process.argv.join(' ')}`))
      if (this.logLevel > 1) {
        console.log()
        console.log(chalk.yellow(`${sep}Warnings:`, chalk.black(this.warnings.length)))
        if (this.warnings.length) {
          console.log(this.warnings.reduce((acc, curr) =>
            acc.concat(`${sep.repeat(2)}${curr.message || curr}\n`)
          , ''))
        }
        console.log(chalk.red(`${sep}Errors:`, chalk.black(this.errors.length)))
        if (this.errors.length) {
          console.log(this.errors.reduce((acc, curr) =>
            acc.concat(`${sep.repeat(2)}${curr.message || curr}\n`)
          , ''))
        }
      }
    }

    console.log()
    console.log(chalk.cyan(`🚅  Build start: ${formattedStartDate}`))
    if (this.logLevel > 1) {
      const startDate = new Date(Date.parse(formattedStartDate)).toISOString()
      console.log(`${sep}${startDate}`)
      console.log()
    }

    console.log(chalk.cyan(`⛳  Build end: ${formattedEndDate}`))
    if (this.logLevel > 1) {
      const endDate = new Date(Date.parse(formattedEndDate)).toISOString()
      console.log(`${sep}${endDate}`)
      console.log()
    }


    console.log(chalk.cyan(`⏳  Elapsed time: ${sequenceEnd}`))
    if (this.logLevel > 1) {
      const times = [...store.bber.taskTimes]
      times.sort((a, b) => parseFloat(a.endMs, 10) > parseFloat(b.endMs, 10) ? 1 : parseFloat(a.endMs, 10) < parseFloat(b.endMs, 10) ? -1 : 0) // eslint-disable-line no-confusing-arrow

      console.log()
      console.log(`${sep}Longest run times:`)
      const slowTasks = 3
      const slowLen = times.length - 1
      for (let i = slowLen; i > slowLen - slowTasks; i--) {
        const sepCount = maxReportingLen.short - times[i].taskName.length - times[i].endMs.length
        const taskInfo = `${times[i].taskName}${' '.repeat(sepCount)}${times[i].endMs}`
        console.log(`${sep.repeat(2)}${taskInfo}`)
      }

      console.log()
      console.log(`${sep}Shortest run times:`)
      const fastTasks = 3
      for (let i = 0; i < fastTasks; i++) {
        const sepCount = maxReportingLen.short - times[i].taskName.length - times[i].endMs.length
        const taskInfo = `${times[i].taskName}${' '.repeat(sepCount)}${times[i].endMs}`
        console.log(`${sep.repeat(2)}${taskInfo}`)
      }


      console.log()
      console.log(`${sep}Tasks sequence:`)
      store.bber.taskTimes.forEach((_) => {
        const sepCount = maxReportingLen.short - _.taskName.length - _.endMs.length
        const taskInfo = `${_.taskName}${' '.repeat(sepCount)}${_.endMs}`
        console.log(`${sep.repeat(2)}${taskInfo}`)
      })
      console.log()
    }

    if (this.logLevel > 1) {
      console.log(chalk.cyan('🎠  Configuration'))
      Object.entries(store.config).forEach(([k, v]) => {
        console.log(`${sep}${k}: ${v}`)
      })
      console.log()
    }


    if (this.logLevel > 1) {
      console.log(chalk.cyan('🎈  Metadata'))
      store.metadata.forEach((_) => {
        console.log(`${sep}${_.term}: ${_.value}`)
      })
      console.log()
    }

    console.log(chalk.cyan(`🐧  Created ${store.spine.length} XHTML file(s)`))
    if (this.logLevel > 1) {
      console.log(chalk.black(store.spine.reduce((acc, curr) =>
        acc.concat(`${curr.absolutePath}\n${sep}`)
      , sep)))
    }

    console.log(chalk.cyan(`🛫  Created ${store.images.length} image(s)`))
    if (this.logLevel > 1) {
      console.log(chalk.black(store.images.reduce((acc, curr) => {
        const { width, height, page } = curr
        const attrs = { width, height, page }

        let formattedAttrs = ''
        Object.entries(attrs).forEach(([k, v]) => {
          formattedAttrs += `${sep.repeat(2)}${k}: ${v}\n`
        })
        const str = `${curr.source}\n${formattedAttrs}`
        return acc.concat(str)
      }, sep)))
    }
  }
}

const log = new Logger()
export default log
