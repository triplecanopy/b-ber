
/**
 * @module async
 */

import { log } from 'plugins'
import { rpad, hrtimeformat } from 'utils'
import * as tasks from 'output'

function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => {
      resolve(value)
    }, time)
  }).catch((err) => {
    log.error(err.formatted || err.message)
    process.exit(1)
  })
}

async function forEachSerial(iterable, asyncBlock) {
  for (const item of iterable) {
    await asyncBlock(item)
  }
}

async function serialize(sequence) {
  const start = process.hrtime()
  let seq
  let diff

  await forEachSerial(sequence, async (func) => {
    const fn = tasks[func] || func
    seq = process.hrtime()
    await delayedPromise(0, fn.call(this))
    diff = process.hrtime(seq)
    log.info(`Resolved ${rpad(func, ' ', 8)} ${hrtimeformat(diff)}`)
  })
  log.info(`Finished ${rpad('', ' ', 8)} ${hrtimeformat(process.hrtime(start))}`)
}

export { delayedPromise, forEachSerial, serialize }
