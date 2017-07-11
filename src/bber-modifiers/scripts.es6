
import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'
import { copy, src, dist } from 'bber-utils'

const write = () =>
  new Promise(resolve =>
    rrdir(path.join(src(), '_javascripts'), (err, files) => {
      if (err) { throw err }
      const filearr = files
      filearr.forEach((file, idx) => {
        copy(file, path.join(dist(), 'OPS/javascripts', path.basename(file)))
        if (idx === filearr.length - 1) {
          resolve()
        }
      })
    })
  )

const scripts = () =>
  new Promise(resolve =>
    fs.mkdirs(path.join(dist(), 'OPS/javascripts'), (err) => {
      if (err) { throw err }
      write().then(resolve)
    })
  )

export default scripts
