import path from 'path'
import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import findIndex from 'lodash/findIndex'
import log from '@canopycanopycanopy/b-ber-logger'
import HtmlToXmlParser from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const fileExtension = '.xhtml'

const writeXML = (str: string) => {
  const cwd = process.cwd()
  const uuid = getBookMetadata('identifier')
  const filePath = path.join(cwd, `${uuid}.xml`)
  return fs.writeFile(filePath, str, 'utf8')
}

const parseHTMLFiles = (files: string[]) =>
  new Promise<string>(resolve => {
    const content = files
      .reduce((acc: string[], curr: string) => {
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
  const spineFiles: any[] = [...state.spine.flattened]
  const figuresTitlePageIndex = findIndex(spineFiles, {
    fileName: 'figures-titlepage',
  })

  let files: string[] = spineFiles.map((entry: any) => `${entry.absolutePath}${fileExtension}`)

  if (figuresTitlePageIndex > -1 && state.loi.length) {
    const loi = state.loi.map((entry: any) => entry.absolutePath)
    files.splice(figuresTitlePageIndex + 1, 0, ...loi)
  }

  return parseHTMLFiles(files)
    .then(writeXML)
    .catch(log.error)
}

export default xml
