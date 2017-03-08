
/**
 * @module publish
 */

// TODO: which books should be moved to `_site`? All? just those that are
// readable? depends on whether there's a download option in the reader.
// Additionally, this might be better rolled into a `deploy` task

import yargs from 'yargs'
import path from 'path'
import cdir from 'copy-dir'
import fs from 'fs-extra'

const cwd = process.cwd()
const publish = () =>
  new Promise((resolve, reject) => {
    const book = yargs.argv.input
    const dest = path.join(cwd, yargs.argv.output, book)

    fs.remove(dest, (err1) => {
      if (err1) { reject(err1) }
      fs.mkdirs(dest, () =>
        cdir(book, dest, (err2) => {
          if (err2) { reject(err2) }
          resolve()
        })
      )
    })
  })

export default publish
