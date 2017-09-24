import store from 'bber-lib/store'
import Timer from './lib/timer'


import { printWarnings, printErrors } from './lib/printer'
import { indent, incrementIndent, decrementIndent, incrementCounter, decrementCounter } from './lib/indenter'

import { bind } from './lib/listeners'
import { notify } from './lib/events'

import { warn } from './lib/warn'
import { info } from './lib/info'
import { error } from './lib/error'
import { debug } from './lib/debug'
import { trace } from './lib/trace'
import { inspect } from './lib/inspect'
import { summary } from './lib/summary'

import { configure } from './lib/configure'
import { registerSequence } from './lib/register'


import { wrap, decorate, floatFormat } from './lib/format'
import { counter, getContext } from './lib/context'
import { composeMessage } from './lib/compose'
import { reset } from './lib/reset'



class Logger extends Timer {

    static defaults = {
        logLevel     : 1,
        boringOutput : false,
        summarize    : false,
        command      : null,
        consoleWidth : 70,
        errors       : [],
        warnings     : [],

        taskWarnings : 0,
        taskErrors   : 0,

        whitespace   : ' ',
        increment    : 4,
        indentLevel  : 4,
        taskCounter  : -1,
        context      : null,
    }

    constructor() {
        super()

        this.logLevel     = Logger.defaults.logLevel
        this.boringOutput = Logger.defaults.boringOutput
        this.command      = Logger.defaults.command
        this.consoleWidth = Logger.defaults.consoleWidth
        this.errors       = Logger.defaults.errors
        this.warnings     = Logger.defaults.warnings

        this.taskWarnings = Logger.defaults.taskWarnings
        this.taskErrors   = Logger.defaults.taskErrors

        this.whitespace   = Logger.defaults.whitespace
        this.increment    = Logger.defaults.increment
        this.indentLevel  = Logger.defaults.indentLevel
        this.taskCounter  = Logger.defaults.taskCounter
        this.context      = Logger.defaults.context


        // options
        this.settings = {
            verbose     : false,
            quiet       : false,
            summarize   : Logger.defaults.summarize,
            'no-color'  : Logger.defaults.boringOutput,
            'log-level' : Logger.defaults.logLevel,
        }




        // bindings
        this.printWarnings = printWarnings.bind(this)
        this.printErrors = printErrors.bind(this)


        this.indent = indent.bind(this)
        this.incrementIndent = incrementIndent.bind(this)
        this.decrementIndent = decrementIndent.bind(this)
        this.incrementCounter = incrementCounter.bind(this)
        this.decrementCounter = decrementCounter.bind(this)


        this.warn = warn.bind(this)
        this.info = info.bind(this)
        this.error = error.bind(this)
        this.debug = debug.bind(this)
        this.trace = trace.bind(this)
        this.inspect = inspect.bind(this)
        this.summary = summary.bind(this)


        this.bind = bind.bind(this)
        this.notify = notify.bind(this)

        this.configure = configure.bind(this)
        this.registerSequence = registerSequence.bind(this)


        this.wrap = wrap.bind(this)
        this.decorate = decorate.bind(this)
        this.floatFormat  = floatFormat.bind(this)

        this.counter = counter.bind(this)
        this.getContext = getContext.bind(this)

        this.composeMessage = composeMessage.bind(this)
        this.reset = reset.bind(this)


        // parse args
        const argv = process.argv.reduce((acc, curr) => {
            const [k, v] = curr.split('=')
            acc[k] = typeof v === 'undefined' ? true : !isNaN(v) ? Number(v) : v
            return acc
        }, {})

        Object.keys(this.settings).forEach((_) => {
            const opt = `--${_}`
            if ({}.hasOwnProperty.call(argv, opt)) {
                this.settings[_] = argv[opt]
            }
        })

        this.configure()
        this.bind()
    }

    printSummary(data) {
        this.summary({ store, ...data })
    }

}

const log = new Logger()
export default log
