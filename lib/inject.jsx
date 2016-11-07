
import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'

import logger from './logger'
import conf from './config'
import { scriptTag, stylesheetTag } from './templates'

const startTags = {
  javascripts: new RegExp('<!-- inject:js -->', 'ig'),
  stylesheets: new RegExp('<!-- inject:css -->', 'ig')
}

const endTags = {
  javascripts: new RegExp('<!-- end:js -->', 'ig'),
  stylesheets: new RegExp('<!-- end:css -->', 'ig')
}

const getLeadingWhitespace = str => str.match(/^\s*/)[0]

const getSources = () => new Promise((resolve, reject) =>
  fs.readdir(`${conf.dist}/OPS/text/`, (err, files) => {
    if (err) { reject(err) }
    resolve(files)
  })
)

const getJavascripts = () => new Promise((resolve, reject) =>
  fs.readdir(`${conf.dist}/OPS/javascripts/`, (err, javascripts) => {
    if (err) { reject(err) }
    resolve({ javascripts })
  })
)

const getStylesheets = () => new Promise((resolve, reject) =>
  fs.readdir(`${conf.dist}/OPS/stylesheets/`, (err, stylesheets) => {
    if (err) { reject(err) }
    resolve({ stylesheets })
  })
)

const getContents = source => new Promise((resolve, reject) =>
  fs.readFile(path.join(__dirname, '../', conf.dist, 'OPS/text', source), (err, data) => {
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

function* matchIterator(re, str) {
  let match
  while ((match = re.exec(str)) !== null) {
    yield match
  }
}

const injectTags = (content, opt) => {
  const toInject = templateify(opt.tagsToInject.slice())
  const startTag = opt.startTag
  const endTag = opt.endTag
  let result
  let endMatch

  for (const startMatch of matchIterator(startTag, content)) {
    endTag.lastIndex = startTag.lastIndex
    endMatch = endTag.exec(content)

    if (!endMatch) { throw new Error(`Missing end tag for start tag: ${startMatch[0]}`) }

    const previousInnerContent = content.substring(startTag.lastIndex, endMatch.index)
    const indent = getLeadingWhitespace(previousInnerContent)

    toInject.unshift(startMatch[0])
    toInject.push(endMatch[0])

    result = [
      content.slice(0, startMatch.index),
      toInject.join(indent),
      content.slice(endTag.lastIndex)
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


const replaceContent = (stream, fpath, startTag, endTag, tagsToInject) =>
  new File({
    path: fpath,
    contents: new Buffer(
      injectTags(
        String(stream.contents),
        { startTag, endTag, tagsToInject })
    )
  })

async function parse() {
  const sources = await getSources()
  const { stylesheets } = await getStylesheets()
  const { javascripts } = await getJavascripts()
  return sources.map(async (source) => {
    const stream1 = await getContents(source)
    replaceContent(
      stream1,
      source,
      startTags.javascripts,
      endTags.javascripts,
      javascripts
    )
    .then(stream2 =>
      replaceContent(
        stream2,
        source,
        startTags.stylesheets,
        endTags.stylesheets,
        stylesheets
      )
    )
    .then((result) => {
      write(
        path.join(__dirname, '../', conf.dist, 'OPS/text', result.path),
        String(result.contents)
      )
    })
  })
}

const inject = () =>
  new Promise(resolve/* , reject */ =>
    parse()
    .catch(err => logger.log(err))
    .then(resolve))

export default inject
