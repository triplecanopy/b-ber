
import logger from './logger'

function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => resolve(value), time)
  }).catch(err => logger.error(err.message))
}

async function forEachSerial(iterable, asyncBlock) {
  for (const item of iterable) {
    await asyncBlock(item)
  }
}

export { delayedPromise, forEachSerial }
