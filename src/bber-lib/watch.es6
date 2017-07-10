import path from 'path'
import fs from 'fs-extra'
import nodemon from 'nodemon'
import { log } from 'bber-plugins'
import { serialize } from 'bber-lib/async'
import { src, dist } from 'bber-utils'

const port = 4000
const debounceSpeed = 400

let timer
let files = []

const restart = () =>
  new Promise(resolve =>
    serialize(['container', 'copy', 'sass', 'scripts', 'render', 'loi', 'inject'])
    .then(resp => resolve(resp))
  )

const watch = () =>
  new Promise((resolve, reject) => {
    const ops = path.join(dist(), 'OPS')
    const text = path.join(ops, 'text')

    fs.readdir(text, (err1, files1) => {
      if (err1) { reject(err1) }
      if (!files1 || files1.length < 1) {
        reject(new Error(`Cant find any files in ${text}`))
      }

      restart().then(() => {
        console.log()
        log.info('Starting nodemon')
        nodemon({
          script: path.join(__dirname, 'server.js'),
          ext: 'md js scss',
          env: { NODE_ENV: 'development' },
          ignore: ['node_modules', 'lib'],
          watch: src(),
          args: [
            '--use_socket_server',
            '--use_hot_reloader',
            `--port ${port}`,
            `--dir ${ops}`,
          ],
        })
        .once('start', resolve)
        .on('restart', (file) => {
          clearTimeout(timer)
          files.push(file)
          timer = setTimeout(() => {
            log.info(`Restarting server due to changes:\n${files.join('\n')}`)
            console.log()
            restart().then(() => { files = [] })
          }, debounceSpeed)
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

export default watch
