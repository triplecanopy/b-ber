
import path from 'path'
import nodemon from 'nodemon'
import log from './log'

const serve = () =>
  new Promise((resolve, reject) => {
    nodemon({
      script: path.join(__dirname, 'server.js'),
      env: { 'NODE_ENV': 'development' }
    }).once('start', () => {
      log.info('Starting nodemon')
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
