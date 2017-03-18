
import * as figures from 'templates/figures'
import * as pages from 'templates/pages'
import * as opf from 'templates/opf'

const container = `<?xml version="1.0"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`

const mimetype = 'application/epub+zip'
const scriptTag = '<script type="application/javascript" src="{% body %}"></script>'
const stylesheetTag = '<link rel="stylesheet" type="text/css" href="{% body %}"/>'

export { container, mimetype, scriptTag, stylesheetTag, pages, figures, opf }
