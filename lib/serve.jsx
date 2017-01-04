
import path from 'path'
import nodemon from 'nodemon'
import opn from 'opn'
import log from './log'

const port = 3000
const serve = () =>
  new Promise((resolve /* , reject */) => {
    nodemon({
      script: path.join(__dirname, 'server.js'),
      env: { NODE_ENV: 'development' }
    }).once('start', () => {
      log.info('Starting nodemon')
      opn(`http://localhost:${port}`)
      resolve()
    })
    process.once('SIGTERM', () => {
      process.exit(0)
    })
    process.once('SIGINT', () => {
      process.exit(0)
    })
  })

export default serve
