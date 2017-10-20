import File from 'vinyl'
import path from 'path'
import { escapeHTML } from 'bber-utils'
import store from 'bber-lib/store'

const tocTmpl = () =>
    new File({
        path: 'tocTmpl.tmpl',
        contents: new Buffer(`${store.templates.dynamicPageHead()}
            <nav id="toc" epub:type="toc">
                <h2>Table of Contents</h2>
                {% body %}
            </nav>
            ${store.templates.dynamicPageTail()}
        `),
    })

const tocItem = (list) => {
    function render(items) {
        return `
            <ol>
                ${items.map(_ => // eslint-disable-line no-confusing-arrow
                    (_.in_toc === false)
                    ? ''
                    : `<li>
                        <a href="${path.basename(_.relativePath)}.xhtml">${escapeHTML(_.title || _.name)}</a>
                            ${_.nodes && _.nodes.length ? render(_.nodes) : ''}
                        </li>`
                ).join('')}
            </ol>`
    }

    return render(list)
}

export { tocTmpl, tocItem }
