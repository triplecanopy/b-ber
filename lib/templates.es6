import File from 'vinyl';

export default {
  container() {
      return `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
          <rootfiles>
            <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`;
    },
    mimetype() {
      return 'application/epub+zip';
    },
    base: new File({
      path: 'base.tmpl',
      contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0" epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
        <head>
          <title></title>
          <meta http-equiv="default-style" content="text/html; charset=utf-8"/>
          <!-- inject:css -->
          <!-- endinject -->
        </head>
        <body>
        {% body %}
        </body>
          <!-- inject:js -->
          <!-- endinject -->
        </html>`)
    })
};
