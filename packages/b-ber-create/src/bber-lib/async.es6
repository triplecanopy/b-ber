/**
 * @module async
 */

import Promise from 'zousan'
import log from 'b-ber-logger'
import * as tasks from 'bber-output'
import store from 'bber-lib/store'

const serialize = (sequence) => {
    return sequence.reduce((acc, task) => {
        const func = tasks[task] || task

        if (typeof func !== 'function') {
            throw new Error(`async#serialize: Invalid parameter [${func}:${typeof func}]`)
        }

        return acc.then(async (resp) => {
            log.notify('start', task)
            await func(resp).then(() => log.notify('stop', task))
        })
    }, Promise.resolve())
    .then(() => log.notify('done', { store }))
}

export { serialize }
