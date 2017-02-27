
import path from 'path'
import fs from 'fs-extra'
import YAML from 'yamljs'
import { fork } from 'child_process'
import Printer from '../modules/printer'
import { log } from '../log'
import { src, dist, build } from '../utils'

const child = fork(`${process.cwd()}/lib/child-pdf.js`)

let input, output, buildType, printer
const initialize = () => {
  input = src()
  output = dist()
  buildType = build()
  printer = new Printer(output)
}

const parseHTML = files =>
  new Promise((resolve, reject) => {
    const dir = path.join(output, 'OPS/text')
    const text = files.map((_, index, arr) => {
      let data
      try {
        data = fs.readFileSync(path.join(dir, _), 'utf8')
      }
      catch (err) {
        return log.warn(err.message)
      }
      return printer.parse(data, index, arr)
    }).filter(Boolean)

    Promise.all(text)
    .catch(err => reject(err))
    .then(docs => resolve(docs.join('\n')))
  })

// const write = content =>
//   new Promise((resolve, reject) =>
//     fs.writeFile(path.join(output, 'pdf.xhtml'), content, (err) => {
//       if (err) { reject(err) }
//       resolve(content)
//     })
//   )

const print = content =>
  new Promise((resolve, reject) => {
    child.on('message', (msg) => {
      if (msg.status === 1) { throw new Error(msg.err) }
      if (msg.status === 0) { resolve() }
    })

    child.on('close', (status) => {
      process.exit(status)
    })

    child.send({
      content,
      options: { base: `file://${output}/OPS/Text/` }
    })

  })


const pdf = () =>
  new Promise(async (resolve, reject) => {
    await initialize()
    const manifest = YAML.load(path.join(input, `${buildType}.yml`))

    parseHTML(manifest)
    // not necessary to write the file, but could be nice to have the document as XHTML
    // .then(content => write(content))
    .then(content => print(content))
    .catch(err => log.error(err))
    .then(resolve)

    // Error: listen EADDRINUSE 0.0.0.0:<port>
    // http://stackoverflow.com/questions/9898372/how-to-fix-error-listen-eaddrinuse-while-using-nodejs/30163868#30163868
    //
    // setTimeout(() => {
    //   console.log(`process didn't exit: ${process.pid}`)
    //   console.log(`to kill the current process, press CTRL + C, then enter \`kill -9 ${process.pid}\``)
    // }, 10000)

  })

export default pdf
