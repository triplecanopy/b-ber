
import yargs from 'yargs'
import path from 'path'
import https from 'https'
import decompress from 'decompress'

import { config } from 'bber-lib'
import { log } from 'bber-plugins'

const cwd = process.cwd()

let dest
const initialize = () => {
  dest = path.join(cwd, yargs.argv.path)
}

const download = () =>
  new Promise((resolve, reject) => {
    const chunks = []
    return https.get(config.reader, (resp) => {
      if (resp.statusCode !== 200) { reject('Could not connect to the server') }
      resp.on('error', err => reject(err))
      resp.on('data', chunk => chunks.push(chunk))
      resp.on('end', () => resolve(Buffer.concat(chunks)))
    })
  })

async function site() {
  await initialize()
  return new Promise((resolve, reject) => {
    if (!{}.hasOwnProperty.call(config, 'reader')) { reject(new Error('No download url.')) }
    download()
    .then(data => decompress(data, dest, { strip: 1 }))
    .catch(err => log.error(err))
    .then(resolve)
  })
}

export default site
