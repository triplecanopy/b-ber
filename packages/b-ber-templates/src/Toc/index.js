import path from 'path'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import { getTitle } from '@canopycanopycanopy/b-ber-lib/utils'

class Toc {
  static body() {
    return new File({
      contents: Buffer.from(
        `<nav id="toc" epub:type="toc"><h2>Table of Contents</h2>{% body %}</nav>`
      ),
    })
  }

  static item(data) {
    const url = `text/${path.basename(data.relativePath)}.xhtml`
    return `<a href="${url}">${Html.escape(getTitle(data, state))}</a>`
  }

  static items(data) {
    return `
            <ol>
                ${data.reduce((acc, curr) => {
                  if (curr.in_toc === false) return acc
                  return acc.concat(`
                        <li>
                            ${Toc.item(curr)}
                            ${
                              curr.nodes && curr.nodes.length
                                ? Toc.items(curr.nodes)
                                : ''
                            }
                        </li>`)
                }, '')}
            </ol>
        `
  }
}

export default Toc
