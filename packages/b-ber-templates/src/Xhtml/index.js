import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'

class Xhtml {
  static head() {
    // TODO
    // @issue: https://github.com/triplecanopy/b-ber/issues/232

    const robotsMeta = state.config.private
      ? '<meta name="robots" content="noindex,nofollow"/>'
      : '<meta name="robots" content="index,follow"/>'

    return new File({
      contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
                <html xmlns="http://www.w3.org/1999/xhtml"
                    xmlns:epub="http://www.idpf.org/2007/ops"
                    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
                    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
                <head>
                    <title></title>
                    <meta http-equiv="default-style" content="text/html charset=utf-8"/>
                    ${robotsMeta}
                    {% body %}
                </head>
                <body>
        `),
    })
  }

  static body() {
    return new File({ contents: Buffer.from('{% body %}') })
  }

  static tail() {
    return new File({ contents: Buffer.from('{% body %}</body></html>') })
  }

  static cover({ width, height, href }) {
    return `
            <section class="cover" style="text-align: center; padding: 0; margin: 0;">
                <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ${width} ${height}" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <image width="${width}" height="${height}" xlink:href="../${href}"/>
                </svg>
            </section>
        `
  }

  static stylesheet(inline = false) {
    return inline
      ? new File({ contents: Buffer.from('<style>{% body %}</style>') })
      : new File({
          contents: Buffer.from(
            '<link rel="stylesheet" type="text/css" href="{% body %}"/>'
          ),
        })
  }

  static javascript(inline = false) {
    return inline
      ? new File({
          contents: Buffer.from(
            '<script type="application/javascript">{% body %}</script>'
          ),
        })
      : new File({
          contents: Buffer.from(
            '<script type="application/javascript" src="{% body %}"></script>'
          ),
        })
  }

  static jsonLD() {
    return new File({
      contents: Buffer.from(
        '<script type="application/ld+json">{% body %}</script>'
      ),
    })
  }

  static loi() {
    return `
            <section epub:type="loi" title="Figures" class="chapter figures">
                <header>
                    <h1>Figures</h1>
                </header>
            </section>
        `
  }
}

export default Xhtml
