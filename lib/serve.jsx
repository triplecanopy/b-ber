
import path from 'path'
import fs from 'fs-extra'
import nodemon from 'nodemon'
import conf from './config'
import log from './log'

const cwd = process.cwd()

const serve = () =>
  new Promise((resolve, reject) => {
    const ops = path.join(cwd, conf.dist, 'OPS')
    const text = path.join(ops, 'text')

    fs.readdir(text, (err, files) => {
      if (err) { reject(err) }
      if (!files || files.length < 1) { reject(new Error(`Cant find any files in ${text}`)) }
      nodemon({
        script: path.join(__dirname,'server.js'),
        ext: 'md js css',
        env: { 'NODE_ENV': 'development' },
        ignore: ['node_modules', 'lib'],
        watch: [conf.src]
      }).once('start', () => {
        log.info('Starting nodemon 😈')
        resolve()
      })
    })
  })

export default serve
