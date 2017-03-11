
import cdir from 'copy-dir'
import path from 'path'
import { src, dist } from '../utils'

const srcs = [
  '_images',
  '_fonts'
]

const copy = () =>
  new Promise((resolve, reject) =>
    srcs.forEach((_, idx) =>
      cdir(path.join(src(), _), path.join(dist(), 'OPS', _.slice(1)), (err) => {
        if (err) { reject(err) }
        if (idx === srcs.length - 1) { resolve() }
      })
    )
  )


export default copy
