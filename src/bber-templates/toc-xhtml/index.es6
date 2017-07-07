import File from 'vinyl'
import { escapeHTML } from 'bber-utils'

const tocTmpl = new File({
  path: 'tocTmpl.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
    </head>
    <body>
      <nav id="toc" epub:type="toc">
        <h2>Table of Contents</h2>
        {% body %}
      </nav>
    </body>
    </html>`),
})

const tocItem = (list) => {
  function render(items) {
    return `
      <ol>
        ${items.map(_ => // eslint-disable-line no-confusing-arrow
          (_.inToc === false)
          ? ''
          : `
            <li>
              <a href="${_.relativePath.slice(1)}">${escapeHTML(_.title || _.name)}</a>
              ${_.nodes && _.nodes.length ? render(_.nodes) : ''}
            </li>`
        ).join('')}
      </ol>`
  }

  return render(list)
}

export { tocTmpl, tocItem }
