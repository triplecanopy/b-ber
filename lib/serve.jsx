
import express from 'express'
import esindex from 'serve-index'
import path from 'path'
import fs from 'fs-extra'
import conf from './config'
import logger from './logger'

const serve = () =>
  new Promise((resolve, reject) => {
    const ops = path.join(__dirname, '../', conf.dist, 'OPS')
    const text = path.join(ops, 'text')
    const port = 3000
    const hidden = ['.opf', '.ncx']
    const options = {
      filter(fname) { return hidden.indexOf(path.extname(fname)) === -1 }
    }

    fs.readdir(text, (err, files) => {
      if (err) { reject(err) }
      if (!files || files.length < 1) { reject(new Error(`Cant find any files in ${text}`)) }

      const app = express()
      app.use(express.static(ops))
      app.use(esindex(ops, options))

      const server = app.listen(port, () =>
        logger.info(`Server is running at localhost:${server.address().port}`))

      resolve()
    })
  })

export default serve
