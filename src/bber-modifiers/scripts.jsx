
import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'
import { copy, src, dist } from 'bber-utils'

let input
let output

const initialize = () => {
  input = path.join(`${src()}/_javascripts`)
  output = path.join(`${dist()}/OPS/javascripts`)
}

const write = () =>
  new Promise((resolve, reject) =>
    rrdir(input, (err, files) => {
      if (err) { reject(err) }
      const filearr = files
      filearr.forEach((file, idx) => {
        copy(file, `${output}/${path.basename(file)}`)
        if (idx === filearr.length - 1) {
          resolve()
        }
      })
    })
  )

const scripts = () =>
  new Promise(async (resolve, reject) => {
    await initialize()
    fs.mkdirs(output, (err) => {
      if (err) { reject(err) }
      write().then(resolve)
    })
  })

export default scripts
