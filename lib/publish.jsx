
import gulp from 'gulp'
import yargs from 'yargs'
import path from 'path'
import cdir from 'copy-dir'
import mkdirp from 'mkdirp'

gulp.task('publish', (done) => {
  const book = yargs.argv.input
  const dest = path.join(__dirname, yargs.argv.output, book)

  mkdirp(dest, () =>
    cdir(book, dest, (err) => {
      if (err) { throw err }
      done()
    })
  )
})
