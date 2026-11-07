import { Html, utils } from '@canopycanopycanopy/b-ber-lib'
import File from 'vinyl'
import type { TocEntry } from '../types'

const { getTitle } = utils

class Toc {
  static body() {
    return new File({
      contents: Buffer.from(
        `<nav id="toc" epub:type="toc"><h2>Table of Contents</h2>{% body %}</nav>`
      ),
    })
  }

  static item(data: TocEntry) {
    const url = `${data.relativePath}.xhtml`
    return `<a href="${url}">${Html.escape(getTitle(data))}</a>`
  }

  static items(data: TocEntry[]): string {
    return `
      <ol>
        ${data.reduce((acc, curr) => {
          if (curr.in_toc === false) return acc

          return acc.concat(`
            <li>
              ${Toc.item(curr)}
              ${curr.nodes && curr.nodes.length ? Toc.items(curr.nodes) : ''}
            </li>
          `)
        }, '')}
      </ol>
  `
  }
}

export default Toc
