
/**
 * @module create
 */

import fs from 'fs-extra'
import path from 'path'
import { log } from 'bber-plugins'
import { container, mimetype } from 'bber-templates'
import { src } from 'bber-utils'

const cwd = process.cwd()

let input
let output
let dirs

/**
 * Write required epub files
 * @return {Promise<Object|Error>}
 */
const write = () =>
  new Promise((resolve, reject) =>
    fs.writeFile(`${output}/META-INF/container.xml`, container, (err1) => {
      if (err1) { reject(err1) }
      fs.writeFile(`${output}/mimetype`, mimetype, (err2) => {
        if (err2) { reject(err2) }
        resolve()
      })
    })
  )

/**
 * Create output directories
 * @return {Promise<Object|Error>}
 */
const makedirs = () =>
  new Promise((resolve, reject) =>
    dirs.map((dir, index) =>
      fs.mkdirs(dir, (err) => {
        if (err) { reject(err) }
        if (index === dirs.length - 1) { resolve() }
      })
    )
  )

const _testParams = (p) => {
  try {
    if (!p) {
      input = src()
    } else if (p && !fs.existsSync(path.resolve(cwd, p))) {
      throw new Error(`Directory ${path.resolve(cwd, p)} does not exist`)
    }
  } catch (err) {
    log.error(err)
    process.exit(1)
  }
  return p
}

/**
 * Create required folder structure and write files
 * @param  {String} _input  [description]
 * @param  {String} _output [description]
 * @return {Promise<Object|Error>}
 */
const create = (_input, _output) =>
  new Promise((resolve, reject) => {
    input = _testParams(_input)
    output = _testParams(_output)

    dirs = [
      `${output}/OPS`,
      `${output}/META-INF`
    ]

    try {
      if (fs.statSync(input)) {
        makedirs()
        .then(write)
        .catch(err => log.error(err))
        .then(resolve)
      }
    } catch (e) {
      reject(new Error(`${input} directory does not exist.`))
    }
  })

export default create
