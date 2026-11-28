import path from 'node:path'
import type {
  BuildContext,
  Spine,
  SpineItem,
} from '@canopycanopycanopy/b-ber-lib'
import HtmlToXmlParser from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import findIndex from 'lodash/findIndex'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import { bookMetadata } from '../context'

const fileExtension = '.xhtml'

const writeXML = (ctx: BuildContext, str: string) => {
  const cwd = process.cwd()
  const uuid = bookMetadata(ctx, 'identifier')
  const filePath = path.join(cwd, `${uuid}.xml`)
  return fs.writeFile(filePath, str, 'utf8')
}

const parseHTMLFiles = (files: string[]) =>
  new Promise<string>((resolve) => {
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

// Joins the book's pages, in spine order with the figure pages after the
// figures titlepage, into one InDesign XML document, `<identifier>.xml`, in
// the working directory
const xml = (
  ctx: BuildContext,
  { spine, loi }: { spine: Spine; loi: SpineItem[] }
) => {
  const spineFiles = [...spine.flattened]
  const figuresTitlePageIndex = findIndex(spineFiles, {
    fileName: 'figures-titlepage',
  })

  const files: string[] = spineFiles.map(
    (entry) => `${entry.absolutePath}${fileExtension}`
  )

  if (figuresTitlePageIndex > -1 && loi.length) {
    const pages = loi.map((entry) => entry.absolutePath)
    files.splice(figuresTitlePageIndex + 1, 0, ...pages)
  }

  return parseHTMLFiles(files)
    .then((str) => writeXML(ctx, str))
    .catch((err) => {
      throw log.error(err)
    })
}

export default xml
