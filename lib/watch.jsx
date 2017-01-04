
import path from 'path'
import fs from 'fs-extra'
import nodemon from 'nodemon'
import opn from 'opn'
import { exec } from 'child_process'
import conf from './config'
import log from './log'

const cwd = process.cwd()
const onRestart = 'npm start -s -- build --invalid'
const port = 4000

const serve = () =>
  new Promise((resolve, reject) => {
    const ops = path.join(cwd, conf.dist, 'OPS')
    const text = path.join(ops, 'text')

    fs.readdir(text, (err1, files1) => {
      if (err1) { reject(err1) }
      if (!files1 || files1.length < 1) { reject(new Error(`Cant find any files in ${text}`)) }
      nodemon({
        script: path.join(__dirname, 'server.js'),
        ext: 'md js css',
        env: { NODE_ENV: 'development' },
        ignore: ['node_modules', 'lib'],
        args: ['--use_socket_server', '--use_hot_reloader', `--port ${port}`],
        watch: [conf.src]
      }).once('start', () => {
        log.info('Starting nodemon')
        opn(`http://localhost:${port}`)
        resolve()
      }).on('restart', (files) => {
        log.info(`Restarting server due to file change:\n:${files}`)
        exec(onRestart, { cwd: './' }, (err2, stdout, stderr) => { // should invoke build, not start a new process
          if (err2) { throw err2 }
          if (stderr) { log.error(stderr) }
          if (stdout) { log.info(stdout) }
        })
      })

      process.once('SIGTERM', () => {
        process.exit(0)
      })
      process.once('SIGINT', () => {
        process.exit(0)
      })
    })
  })

export default serve
