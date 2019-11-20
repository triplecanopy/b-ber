import path from 'path'
import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import log from '@canopycanopycanopy/b-ber-logger'
import HtmlToXmlParser from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const fileExtension = '.xhtml'

const writeXML = str => {
  const cwd = process.cwd()
  const uuid = getBookMetadata('identifier', state)
  const filePath = path.join(cwd, `${uuid}.xml`)
  return fs.writeFile(filePath, str, 'utf8')
}

const parseHTMLFiles = files =>
  new Promise(resolve => {
    const content = files
      .reduce((acc, curr) => {
        const filePath = isPlainObject(curr)
          ? Object.keys(curr)[0]
          : isString(curr)
          ? curr
          : null

        if (!filePath) return acc

        const data = fs.readFileSync(filePath, 'utf8')
        return acc.concat(`${data}`)
      }, [])
      .join('<pagebreak></pagebreak>')

    const parser = new HtmlToXmlParser({ content, onEndCallback: resolve })
    parser.parse()
  })

const xml = () => {
  const files = state.spine.flattened
    .map(entry => `${entry.absolutePath}${fileExtension}`)
    .concat(state.loi.map(entry => entry.absolutePath))

  return parseHTMLFiles(files)
    .then(writeXML)
    .catch(log.error)
}

export default xml
