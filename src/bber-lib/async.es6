
/**
 * @module async
 */

import Promise from 'vendor/Zousan'
import { log } from 'bber-plugins'
import { rpad, hrtimeformat } from 'bber-utils'
import * as tasks from 'bber-output'

/**
 * [delayedPromise description]
 * @param  {Number} time              [description]
 * @param  {*} value                  [description]
 * @return {Promise<Object|Error>}
 */
function delayedPromise(time, value) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(value) }, time)
  }).catch((err) => {
    log.error(err.formatted || err.message)
    process.exit(1)
  })
}

/**
 * [forEachSerial description]
 * @param  {Iterable<Array>} iterable     [description]
 * @param  {Promise<Object>} asyncBlock   [description]
 * @return {Promise<Object|Error>}
 */
async function forEachSerial(iterable, asyncBlock) {
  for (const item of iterable) {
    await asyncBlock(item)
  }
}

/**
 * [serialize description]
 * @param  {Array} sequence           [description]
 * @return {Promise<Object|Error>}
 */
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
