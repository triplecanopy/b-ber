
import cdir from 'copy-dir'
import path from 'path'
import conf from './config'

const cwd = process.cwd()
const src = [
  '_images',
  '_fonts'
]

const copy = () =>
  new Promise((resolve, reject) =>
    src.forEach((_, idx) =>
      cdir(path.join(cwd, conf.src, _), path.join(cwd, conf.dist, 'OPS', _.slice(1)), (err) => {
        if (err) { reject(err) }
        if (idx === src.length - 1) { resolve() }
      })
    )
  )


export default copy
