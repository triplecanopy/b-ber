
import path from 'path'
import { exec } from 'child_process'
import logger from './logger'
import conf from './config'

const timestamp = String(Date.now())
const bookname = `"${timestamp}.epub"`
const bookpath = path.join(__dirname, '../', bookname)

const commands = {
  remove: 'epubs=`ls -1 *.epub 2>/dev/null | wc -l`; if [ $epubs != 0 ]; then rm *.epub; fi',
  compile: [
    `zip -X0 ${bookpath} ./mimetype`,
    `zip -X9Dr ${bookpath} ./META-INF -x *.DS_Store`,
    `zip -X9Dr ${bookpath} ./OPS -x *.DS_Store`
  ].join(' && '),
  // TODO: assumes that epubcheck is symlinked to ./epubcheck
  validate: `java -jar epubcheck -e ${bookname}` // -e: only show fatal errors
}

const report = (err, stdout, stderr, reject) => {
  if (err) { reject(err) }
  if (stderr !== '') { reject(new Error(stderr)) }
  if (stdout !== '') { logger.info(stdout) }
}

const run = (cmd, dir) =>
  new Promise((resolve, reject) =>
    exec(commands[cmd], { cwd: dir }, (err, stdout, stderr) => {
      report(err, stdout, stderr, reject)
      resolve()
    })
  )

const epub = () =>
  new Promise(resolve/* , reject */ =>
    run('remove', './')
    .then(_ => run('compile', conf.dist))
    .then(_ => run('validate', './'))
    .catch(err => logger.error(err))
    .then(resolve)
  )

export default epub
