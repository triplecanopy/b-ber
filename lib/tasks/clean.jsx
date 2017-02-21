
import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import conf from '../config'
import { logg } from '../log'

import actions from '../state'

import { createPathsFromDefaultsOrBuildVars } from '../utils'

const cwd = process.cwd()
// const dist = path.join(cwd, yargs.argv.build)

const clean = () =>
  new Promise((resolve, reject) => {
    // const { dist } = createPathsFromDefaultsOrBuildVars(yargs.argv)
      // console.log('------- calls clean')
      // console.log(yargs.argv)

      return setTimeout(() => {
        console.log(actions.getBber('build'))
        console.log('done clean')
        resolve()
      }, 100)
    // fs.remove(dist, (err) => {
    //   if (err) { reject(err) }
    //   resolve()
    // })
  })

export default clean




// import fs from 'fs-extra'
// import yargs from 'yargs'
// import { log } from '../log'
// import { promisify } from './async'
// import { createPathsFromDefaultsOrBuildVars } from '../utils'

// const callback = dir =>
//   new Promise((resolve, reject) => {
//     fs.remove(dir, (err) => {
//       if (err) { reject(err) }
//       console.log('resolved')
//       resolve()
//     })
//   })

// const clean = () =>
//   new Promise((resolve, reject) => {
//     const { dist } = createPathsFromDefaultsOrBuildVars(yargs.argv)
//     promisify(callback, dist).catch(err => log.error(err)).then(resolve)
//   })

// export default clean
