
function delayedPromise(time, value) {
  return new Promise((resolve/* , reject */) => {
    setTimeout(() => resolve(value), time)
  })
}

async function forEachSerial(iterable, asyncBlock) {
  for (const item of iterable) {
    await asyncBlock(item)
  }
}

export { delayedPromise, forEachSerial }
