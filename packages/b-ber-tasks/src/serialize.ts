import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import * as tasks from './task-handlers'

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

type TaskFn = (resp?: unknown) => Promise<unknown>
type TaskEntry = string | TaskFn

function validate(fn: unknown): asserts fn is TaskFn {
  if (typeof fn !== 'function') {
    throw new Error(
      `async#serialize: Invalid parameter [${fn}] is [${typeof fn}], expected [function]`
    )
  }
}

const done = (resp: unknown) => {
  log.notify('done', { state })
  return resp
}

const taskReducer = (acc: Promise<unknown>, curr: TaskEntry) => {
  const fn =
    (typeof curr === 'string'
      ? (tasks as Record<string, unknown>)[curr]
      : curr) ?? curr
  validate(fn)

  return acc.then((resp) => {
    log.notify('start', curr)

    return fn(resp).then((resp2) => {
      log.notify('stop', curr)
      return resp2
    })
  })
}

const serialize = (sequence: TaskEntry[]) =>
  sequence
    .reduce(taskReducer, Promise.resolve<unknown>(undefined))
    .then(done)
    .catch(log.error)

export default serialize
