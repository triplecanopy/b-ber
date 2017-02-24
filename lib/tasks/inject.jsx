
import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'

import { log } from '../log'
import { scriptTag, stylesheetTag } from '../templates'
import { dist } from '../utils'

let output
const initialize = () => {
  output = dist()
}

const startTags = {
  javascripts: new RegExp('<!-- inject:js -->', 'ig'),
  stylesheets: new RegExp('<!-- inject:css -->', 'ig')
}

const endTags = {
  javascripts: new RegExp('<!-- end:js -->', 'ig'),
  stylesheets: new RegExp('<!-- end:css -->', 'ig')
}

const getDirContents = dirpath =>
  new Promise((resolve, reject) =>
    fs.readdir(dirpath, (err, files) => {
      if (err) { reject(err) }
      if (!files) { throw new Error(`No files found in \`${path.basename(dirpath)}\``) }
      resolve(files)
    }))

const getContents = source => new Promise((resolve, reject) =>
  fs.readFile(path.join(output, 'OPS/text', source), (err, data) => {
    if (err) { reject(err) }
    resolve(new File({ contents: new Buffer(data) }))
  })
)

const templateify = files =>
  files.map((file) => {
    switch (path.extname(file).toLowerCase()) {
      case '.js':
        return scriptTag.replace(/\{% body %\}/, `../javascripts/${file}`)
      case '.css':
        return stylesheetTag.replace(/\{% body %\}/, `../stylesheets/${file}`)
      default:
        throw new Error(`Unsupported filetype: ${file}`)
    }
  })

const getLeadingWhitespace = str => str.match(/^\s*/)[0]

function* matchIterator(re, str) {
  let match
  while ((match = re.exec(str)) !== null) {
    yield match
  }
}

const injectTags = (content, args) => {
  const { data, start, stop } = args
  const toInject = templateify(data.slice())
  let result = ''
  let endMatch

  for (const startMatch of matchIterator(start, content)) {
    stop.lastIndex = start.lastIndex
    endMatch = stop.exec(content)

    if (!endMatch) { throw new Error(`Missing end tag for start tag: ${startMatch[0]}`) }

    const previousInnerContent = content.substring(start.lastIndex, endMatch.index)
    const indent = getLeadingWhitespace(previousInnerContent)

    toInject.unshift(startMatch[0])
    toInject.push(endMatch[0])

    result = [
      content.slice(0, startMatch.index),
      toInject.join(indent),
      content.slice(stop.lastIndex)
    ].join('')
  }

  return result
}

const write = (location, data) =>
  new Promise((resolve, reject) =>
    fs.writeFile(location, data, (err) => {
      if (err) { reject(err) }
      resolve()
    })
  )

const promiseToReplace = (prop, data, source, file) =>
  new Promise(async (resolve/* , reject */) => {
    const stream = file || await getContents(source)
    const start = startTags[prop]
    const stop = endTags[prop]
    const result = new File({
      path: source,
      contents: new Buffer(
        injectTags(
          stream.contents.toString('utf8'),
          { start, stop, data }
        )
      )
    })

    resolve(result)
  })

const mapSources = (stylesheets, javascripts, sources) =>
  new Promise((resolve/* , reject */) => {
    sources.map(source =>
      promiseToReplace('stylesheets', stylesheets, source)
      .then(file => promiseToReplace('javascripts', javascripts, source, file))
      .then(file => write(
          path.join(output, 'OPS/text', source),
          file.contents.toString('utf8')))
      .catch(err => log.error(err))
      .then(resolve)
    )
  })

const inject = () =>
  new Promise(async (resolve/* , reject */) => {
    await initialize()
    const textSources = await getDirContents(`${output}/OPS/text/`)
    const stylesheets = await getDirContents(`${output}/OPS/stylesheets/`)
    const javascripts = await getDirContents(`${output}/OPS/javascripts/`)
    mapSources(stylesheets, javascripts, textSources)
    .catch(err => log.error(err))
    .then(resolve)
  })

export default inject
