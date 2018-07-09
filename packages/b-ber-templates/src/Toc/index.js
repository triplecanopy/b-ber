/* eslint-disable indent */

import path from 'path'
import File from 'vinyl'
import {Html} from '@canopycanopycanopy/b-ber-lib'
import {getTitleOrName} from '@canopycanopycanopy/b-ber-lib/utils'
import state from '@canopycanopycanopy/b-ber-lib/State'


class Toc {
    static document() {
        return new File({
            path: 'toc.document.tmpl',
            contents: new Buffer(`${state.templates.dynamicPageHead()}
                <nav id="toc" epub:type="toc">
                    <h2>Table of Contents</h2>
                    {% body %}
                </nav>
                ${state.templates.dynamicPageTail()}
            `),
        })
    }
    static item(data) {
        return `<a href="${path.basename(data.relativePath)}.xhtml">${Html.escape(getTitleOrName(data))}</a>`
    }

    static items(data) {
        return `
            <ol>
                ${data.map(a => {
                    if (a.in_toc === false) return ''
                    return `
                        <li>
                            ${Toc.item(a)}
                            ${a.nodes && a.nodes.length ? Toc.items(a.nodes) : ''}
                        </li>
                    `
                    }).join('')
                }
            </ol>
        `
    }
}

export default Toc
