/**
 * @module async
 */

import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

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

const serialize = (sequence, tasks) =>
    sequence.reduce((acc, task) => {

        const func = tasks[task] || task

        if (typeof func !== 'function') throw new Error(`async#serialize: Invalid parameter [${func}] is [${typeof func}], expected [function]`)

        return acc.then(async resp => {
            log.notify('start', task)
            return func(resp).then(data => {
                log.notify('stop', task)
                return data
            })
        })

    }, Promise.resolve())

        .then(response => {
            log.notify('done', {state})
            return response
        })

export default {serialize}
