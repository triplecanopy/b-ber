
import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import http from 'http'
import decompress from 'decompress'
import { exec } from 'child_process'

import conf from './config'
import logger from './logger'

const dest = path.join(__dirname, '../_site')

async function getZipURI() {
  return yargs.argv.path
}

const download = () =>
  new Promise((resolve, reject) => {
    const chunks = []
    return http.get(conf.gomez, (resp) => {
      resp.on('error', reject)
      resp.on('data', chunk => chunks.push(chunk))
      resp.on('end', () => resolve(Buffer.concat(chunks)))
    })
  })

const install = () =>
  new Promise((resolve, reject) => {
    try {
      if (fs.statSync(`${dest}/package.json`)) {
        exec('npm install', { cwd: dest }, (err, stdout, stderr) => {
          if (err) { throw err }
          if (stderr !== '') { logger.info(stderr) }
          if (stdout !== '') { logger.info(stdout) }
          resolve()
        })
      }
    } catch (e) {
      logger.info(`\n${dest}/package.json does not exist, try initializing b-ber again with \`b-ber init\`.`)
      logger.info(`e.message\n`)
      reject()
      process.exit()
    }
  })

async function site() {
  const zipURI = await getZipURI()
  return new Promise((resolve, reject) => {
    if (!{}.hasOwnProperty.call(conf, 'gomez')) { reject('No download url.') }
    download(zipURI)
      .then(data => decompress(data, dest))
      .then(install)
      .then(resolve)
  })
}

export default site
