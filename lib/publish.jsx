
import gulp from 'gulp'
import yargs from 'yargs'
import path from 'path'
import cdir from 'copy-dir'
import fs from 'fs-extra'

const publish = () =>
  new Promise((resolve, reject) => {
    const book = yargs.argv.input
    const dest = path.join(__dirname, yargs.argv.output, book)

    fs.mkdirs(dest, () =>
      cdir(book, dest, (err) => {
        if (err) { throw err }
        resolve()
      })
    )
  })
