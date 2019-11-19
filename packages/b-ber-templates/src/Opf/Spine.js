import path from 'path'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { fileId } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'

class Spine {
  static body() {
    return new File({
      path: 'spine.body.tmpl',
      contents: Buffer.from('<spine toc="_toc_ncx">{% body %}</spine>'),
    })
  }

  static item({ fileName, extension, linear }) {
    const idref = fileId(path.basename(fileName, extension))
    return `<itemref idref="${idref}_xhtml" linear="${linear ? 'yes' : 'no'}"/>`
  }

  static items(data) {
    return data.reduce((acc, curr) => {
      const { fileName } = curr

      if (curr.linear === false) {
        if (state.build === 'mobi') {
          log.info(
            `opf templates/spine omitting non-linear asset [${fileName}] for mobi build`
          )
          return acc
        }

        log.info(`opf templates/spine writing non-linear asset [${fileName}]`)
      }

      if (fileName.match(/figure/)) {
        // TODO: this should be handled more transparently, rn it feels a bit like a side-effect
        // https://github.com/triplecanopy/b-ber/issues/208

        log.info('opf templates/spine writing [loi]')

        if (state.loi.length) {
          return acc.concat(
            state.loi.reduce(
              (acc2, curr2) =>
                acc2.concat(Spine.item({ ...curr2, linear: true })),
              Spine.item(curr)
            )
          )
        }
      }

      return acc.concat(Spine.item(curr))
    }, '')
  }
}

export default Spine
