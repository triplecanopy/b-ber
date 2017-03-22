
import path from 'path'
import nodemon from 'nodemon'
import opn from 'opn'
import { log } from 'bber-plugins'

class Server {
  constructor(port) {
    this.port = port || 3000
  }

  serve() {
    return new Promise((resolve /* , reject */) => {
      nodemon({
        script: path.join(__dirname, 'server.js'),
        env: { NODE_ENV: 'development' }
      }).once('start', () => {
        log.info('Starting nodemon')
        opn(`http://localhost:${this.port}`)
        resolve()
      })
      process.once('SIGTERM', () => {
        process.exit(0)
      })
      process.once('SIGINT', () => {
        process.exit(0)
      })
    })
  }
}


export default Server
