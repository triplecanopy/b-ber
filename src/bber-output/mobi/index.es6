/**
 * @module mobi
 */

import Promise from 'zousan'
import zipper from 'mobi-zipper'
import path from 'path'
import { log } from 'bber-plugins'
import { dist } from 'bber-utils'

const mobi = () =>
  new Promise(resolve =>
    zipper.create({
      input: path.join(dist(), 'OPS/content.opf'),
      output: process.cwd(),
      clean: true,
    })
    .catch(err => log.error(err))
    .then(resolve)
  )

export default mobi
