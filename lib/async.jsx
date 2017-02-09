
import { log } from './log'

function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => resolve(value), time)
  }).catch(err => log.error(err.message))
}

async function forEachSerial(iterable, asyncBlock) {
  for (const item of iterable) {
    await asyncBlock(item)
  }
}

export { delayedPromise, forEachSerial }
