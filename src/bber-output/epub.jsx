
/* eslint-disable */

/**
 * @module epub
 */

import zipper from 'epub-zipper'
import { log } from 'bber-plugins'
import { dist } from 'bber-utils'

/**
 * Epub compilation options
 * @return {{input: String, output: String, clean: Boolean}}
 */
// const options = () => ({
//   input: dist(),
//   output: process.cwd(),
//   clean: true
// })

/**
 * Compiles epub
 * @return {Promise<Object|Error>}
 */

const epub = () => {
  return new Promise((resolve, reject) => {
    console.log('---- calls epub')
    resolve(1)
  })
}


// const epub = () =>
//   new Promise(async resolve/* , reject */ =>
//     resolve()
//   //   zipper.create(await options())
//   //   .catch(err => log.error(err))
//   //   .then(resolve)
//   )

export default epub
