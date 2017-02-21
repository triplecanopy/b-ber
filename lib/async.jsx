
import { log } from './log'
import { rpad, hrtimeformat } from './utils'
import * as tasks from './tasks'

function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => resolve(value), time)
  }).catch(err => log.error(err.formatted || err.message))
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

async function serialize2(sequence) {
  await forEachSerial(sequence, async (func) => {
    await delayedPromise(0, func.call(this))
    console.log('done')
  })
  console.log('alllll done')
}

function promisify(callback, arr) {
  const funcs = []
  arr.forEach(_ => funcs.push(() => callback(_)))
  return serialize2(funcs)
}

export { delayedPromise, forEachSerial, serialize, serialize2, promisify }
