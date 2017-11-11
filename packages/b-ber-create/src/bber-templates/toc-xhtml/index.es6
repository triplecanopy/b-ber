import File from 'vinyl'
import path from 'path'
import { escapeHTML, getTitleOrName } from 'bber-utils'
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
                ${items.map(a => // eslint-disable-line no-confusing-arrow
                    (a.in_toc === false)
                    ? ''
                    : `<li>
                        <a href="${path.basename(a.relativePath)}.xhtml">${escapeHTML(getTitleOrName(a))}</a>
                            ${a.nodes && a.nodes.length ? render(a.nodes) : ''}
                        </li>`
                ).join('')}
            </ol>`
    }

    return render(list)
}

export { tocTmpl, tocItem }
