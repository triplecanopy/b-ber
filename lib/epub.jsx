
import path from 'path'
import { exec } from 'child_process'
import logger from './logger'
import conf from './config'

const timestamp = String(Date.now())
const bookname = `"${timestamp}.epub"`
const bookpath = path.join(__dirname, '../', bookname)

const remove = 'epubs=`ls -1 *.epub 2>/dev/null | wc -l`; if [ $epubs != 0 ]; then rm *.epub; fi'
const compile = [
  `zip -X0 ${bookpath} ./mimetype`,
  `zip -X9Dr ${bookpath} ./META-INF -x *.DS_Store`,
  `zip -X9Dr ${bookpath} ./OPS -x *.DS_Store`
].join(' && ')

// TODO: assumes that epubcheck is symlinked to ./epubcheck
const validate = `java -jar epubcheck -e ${bookname}` // -e: only show fatal errors

const report = (err, stdout, stderr, reject) => {
  if (err) { reject(err) }
  if (stderr !== '') { reject(new Error(stderr)) }
  if (stdout !== '') { logger.info(stdout) }
}

const epub = () =>
  new Promise((resolve, reject) =>
    exec(remove, { cwd: './' }, (err1, stdout1, stderr1) => {
      report(err1, stdout1, stderr1, reject)
      return exec(compile, { cwd: conf.dist }, (err2, stdout2, stderr2) => {
        report(err2, stdout2, stderr2, reject)
        return exec(validate, { cwd: './' }, (err3, stdout3, stderr3) => {
          report(err3, stdout3, stderr3, reject)
          resolve()
        })
      })
    })
  )

export default epub
