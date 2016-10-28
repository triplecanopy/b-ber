
import cp from 'child_process'
import path from 'path'
import logger from './logger'
import conf from './config'

const exec = cp.exec
const timestamp = String(Date.now())
const bookname = `"${timestamp}.epub"`

const remove = 'epubs=`ls -1 *.epub 2>/dev/null | wc -l`; if [ $epubs != 0 ]; then rm *.epub; fi'
const compile = [
  `zip -X0 ${path.join(__dirname, '../', bookname)} ./mimetype`,
  `zip -X9Dr ${path.join(__dirname, '../', bookname)} ./META-INF -x *.DS_Store`,
  `zip -X9Dr ${path.join(__dirname, '../', bookname)} ./OPS -x *.DS_Store`
].join(' && ')

// TODO: assumes that epubcheck is symlinked to ./epubcheck
const validate = `java -jar epubcheck -e ${bookname}` // -e: only show fatal errors

const report = (err, stdout, stderr) => {
  const msg = []
  let error

  if (err) { throw err }
  if (stdout !== '') { msg.push(stdout) }
  if (stderr !== '') {
    msg.push(stderr)
    error = true
  }
  if (msg.length) { msg.map(_ => logger.info(_)) }
  if (error) { process.exit() }
}

const epub = () =>
  new Promise((resolve, reject) =>
    exec(remove, { cwd: './' }, (err1, stdout1, stderr1) => {
      report(err1, stdout1, stderr1)
      return exec(compile, { cwd: conf.dist }, (err2, stdout2, stderr2) => {
        report(err2, stdout2, stderr2)
        return exec(validate, { cwd: './' }, (err3, stdout3, stderr3) => {
          report(err3, stdout3, stderr3)
          resolve()
        })
      })
    })
  )

export default epub
