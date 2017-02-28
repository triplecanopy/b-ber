
import { log } from './log'
import { rpad, hrtimeformat } from './utils'
import * as tasks from './tasks'

function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => resolve(value), time)
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
  let seq, diff

  await forEachSerial(sequence, async (func) => {
    seq = process.hrtime()
    await delayedPromise(0, tasks[func].call(this))
    diff = process.hrtime(seq)
    log.info(`Resolved ${rpad(func, ' ', 8)} ${hrtimeformat(diff)}`)
  })
  log.info(`Finished ${rpad('', ' ', 8)} ${hrtimeformat(process.hrtime(start))}`)
}

export { delayedPromise, forEachSerial, serialize }
