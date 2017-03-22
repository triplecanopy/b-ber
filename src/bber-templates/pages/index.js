
import File from 'vinyl'
import { getFrontmatter } from 'bber-utils'

const pageHead = name => `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
      <!-- inject:css -->
      <!-- end:css -->
    </head>
    <body${getFrontmatter({ name }, 'template') ? ` class="${getFrontmatter({ name }, 'template')}"` : ''}>`

const pageTail = () => `<!-- inject:js -->
      <!-- end:js -->
    </body>
    </html>`

const pageBody = new File({
  path: 'base.tmpl',
  contents: new Buffer('{% body %}')
})

const page = new File({
  path: 'base.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
      <!-- inject:css -->
      <!-- end:css -->
    </head>
    <body>
      {% body %}
      <!-- inject:js -->
      <!-- end:js -->
    </body>
    </html>`)
})

const loiLeader = () =>
  `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
    <header>
      <h1>Figures</h1>
    </header>
  </section>`

export { pageHead, pageTail, pageBody, page, loiLeader }
