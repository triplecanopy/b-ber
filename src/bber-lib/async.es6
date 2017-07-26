/* eslint-disable import/prefer-default-export */
/**
 * @module async
 */

import Promise from 'zousan'
import { log } from 'bber-plugins'
import { hrtimeformat } from 'bber-utils'
import * as tasks from 'bber-output'
import store from 'bber-lib/store'
import chalk from 'chalk'

const dateFormattingOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

let taskBegin
let taskEnd

const serialize = (sequence) => {
  const sequenceBegin = process.hrtime()
  const formattedStartDate = new Date().toLocaleDateString('en-CA', dateFormattingOptions)

  log.reset()
  store.bber.taskTimes = []

  return sequence.reduce((acc, _func) => {
    const func = tasks[_func] || _func

    if (typeof func !== 'function') {
      throw new Error(`async#serialize: Invalid parameter [${func}:${typeof func}]`)
    }

    return acc.then(async (resp) => {
      taskBegin = process.hrtime()
      if (log.logLevel > 1 && process.env.NODE_ENV !== 'test') {
        console.log(chalk.green('🐪 '), 'Starting', chalk.black(`[${_func}]`))
      }
      await func(resp).then(() => {
        taskEnd = process.hrtime(taskBegin)
        if (process.env.NODE_ENV !== 'test') {
          console.log(
            chalk.green('✔ '),
            'Finished', chalk.green(`[${_func}]`),
            `after ${hrtimeformat(taskEnd)}`
          )
        }

        store.bber.taskTimes.push({
          taskName: _func,
          endHrtime: taskEnd,
          endMs: hrtimeformat(taskEnd),
        })

        if (log.logLevel > 0 && process.env.NODE_ENV !== 'test') { console.log() }
      })
    })
  }, Promise.resolve())
  .then(() => {
    const sequenceEnd = hrtimeformat(process.hrtime(sequenceBegin))
    const formattedEndDate = new Date().toLocaleDateString('en-CA', dateFormattingOptions)
    log.summary({ store, formattedStartDate, formattedEndDate, sequenceEnd })
  })
}

export { serialize }
