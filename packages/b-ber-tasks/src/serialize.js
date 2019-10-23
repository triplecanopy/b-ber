import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import * as tasks from '../'

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

const validate = fn => {
    if (typeof fn !== 'function') {
        throw new Error(`async#serialize: Invalid parameter [${fn}] is [${typeof fn}], expected [function]`)
    }
}

const done = resp => {
    log.notify('done', { state })
    return resp
}

const taskReducer = (acc, curr) => {
    const fn = tasks[curr] || curr
    validate(fn)

    return acc.then(resp => {
        log.notify('start', curr)

        return fn(resp).then(resp2 => {
            log.notify('stop', curr)
            return resp2
        })
    })
}

const serialize = sequence =>
    sequence
        .reduce(taskReducer, Promise.resolve())
        .then(done)
        .catch(log.error)

export default serialize
