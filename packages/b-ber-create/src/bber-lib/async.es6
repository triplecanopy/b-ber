/**
 * @module async
 */

/* eslint-disable import/prefer-default-export */

import Promise from 'zousan'
import log from '@canopycanopycanopy/b-ber-logger'
import * as tasks from 'bber-output'
import store from 'bber-lib/store'

// This is basically the engine of our application. `serialize` is responsible
// for taking in the list of tasks that need to be run, calling their
// associated handlers, handling errors if any are encountered, and then
// calling the next task in the list.
//
// b-ber is designed so that there are two components to each task:
//
//      1) a command script that's invoked by the user from the CLI, used to
//         parse the CLI arguments
//
//      2) a handler script that actually does the work
//
// `serialize` works by calling the handlers that are exported by `bber-
// output/index.js` directly.
//

const serialize = sequence =>
    sequence.reduce((acc, task) => {
        const func = tasks[task] || task

        if (typeof func !== 'function') {
            throw new Error(`async#serialize: Invalid parameter [${func}:${typeof func}]`)
        }

        return acc.then(async resp => {
            log.notify('start', task)
            await func(resp).then(_ => log.notify('stop', task))
        })
    }, Promise.resolve())
    .then(_ => log.notify('done', { store }))

export { serialize }
