import File from 'vinyl'
import { env } from 'bber-utils'

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
  function render(arr) {
    return `<ol>
      ${arr.map((_, i) => {
        if (!_.opsPath) { return '' }
        return `<li>
            <a href="${_.opsPath.slice(1)}">${_.title || _.name}</a>
              ${(arr[i + 1] && arr[i + 1].constructor === Array) ? render(arr[i + 1]) : ''}
            </li>`
      }).join('')}
    </ol>`
  }
  return env() === 'production' ? render(list).replace(/\s*\n\s*/g, '') : render(list)
}

export { tocTmpl, tocItem }
