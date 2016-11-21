
import path from 'path'
import { exec } from 'child_process'
import logger from './logger'
import conf from './config'

const timestamp = String(Date.now())
const bookname = `"${timestamp}.mobi"`

const remove = 'mobis=`ls -1 *.mobi 2>/dev/null | wc -l`; if [ $mobis != 0 ]; then rm *.mobi; fi'
const compile = [ // TODO: assumes that `ebook-convert` is globally available
  `ebook-convert OPS/content.opf ${bookname}`,
  '--mobi-file-type=both',
  '--disable-font-rescaling',
  '--no-inline-toc',
  `&& mv ${bookname} ../${bookname}`
].join(' ')

const report = (err, stdout, stderr, reject) => {
  const msg = []
  let error

  if (err) {
    error = true
    msg.push(err)
  }
  if (stdout !== '') {
    msg.push(stdout)
  }
  if (stderr !== '') {
    error = true
    msg.push(stderr)
  }
  if (msg.length) { msg.map(_ => logger.info(_)) }
  if (error) { reject(process.exit()) }
}

const mobi = () =>
  new Promise((resolve, reject) =>
    exec(remove, { cwd: './' }, (err1, stdout1, stderr1) => {
      report(err1, stdout1, stderr1, reject)
      return exec(compile, { cwd: conf.dist }, (err2, stdout2, stderr2) => {
        report(err2, stdout2, stderr2, reject)
        resolve()
      })
    })
  )

export default mobi
