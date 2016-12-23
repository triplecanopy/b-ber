
import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import http from 'http'
import decompress from 'decompress'
import { exec } from 'child_process'

import conf from './config'
import log from './log'

let dest
const setDest = () => {
  dest = path.join(__dirname, '../', yargs.argv.path)
  return dest
}

const download = () =>
  new Promise((resolve, reject) => {
    const chunks = []
    return http.get(conf.gomez, (resp) => {
      if (resp.statusCode !== 200) { reject('Could not connect to the server') }
      resp.on('error', err => reject(err))
      resp.on('data', chunk => chunks.push(chunk))
      resp.on('end', () => resolve(Buffer.concat(chunks)))
    })
  })

const install = () =>
  new Promise((resolve, reject) => {
    // fs.statSync throws an error if the file doesn't exist, but the Promise
    // will continue to execute. We `exit` the process if the file doesn't
    // exist in `try` block's `catch`, or continue to execute the Promise if
    // it does.

    try {
      if (fs.statSync(`${dest}/package.json`)) {
        log.info('Installing package dependencies, this may take a while ...')
      }
    } catch (e) {
      log.error(`\`_site/package.json\` does not exist. Try initializing b-ber again with \`b-ber init\`.\n\n${e.message}`) // eslint-disable-line max-len
      process.exit()
    }

    exec('npm install', { cwd: dest }, (err, stdout, stderr) => {
      if (err) { reject(err) }
      if (stderr !== '') { reject(new Error(stderr)) }
      if (stdout !== '') { log.info(stdout) }
      resolve()
    })
  })

function site() {
  setDest()
  return new Promise((resolve, reject) => {
    if (!{}.hasOwnProperty.call(conf, 'gomez')) { reject(new Error('No download url.')) }
    download()
    .then(data => decompress(data, dest))
    .then(install)
    .catch(err => log.error(err))
    .then(resolve)
  })
}

export default site
