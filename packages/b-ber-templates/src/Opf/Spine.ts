import path from 'node:path'
import {
  type SpineItem,
  State as state,
  utils,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import File from 'vinyl'

const { fileId } = utils

// A spine entry, from the spine's flat list or the figure pages
type SpineEntry = Pick<SpineItem, 'fileName' | 'extension' | 'linear'>

class Spine {
  static body() {
    return new File({
      path: 'spine.body.tmpl',
      contents: Buffer.from('<spine toc="_toc_ncx">{% body %}</spine>'),
    })
  }

  static item({ fileName, extension, linear }: SpineEntry) {
    const idref = fileId(path.basename(fileName, extension))
    return `<itemref idref="${idref}_xhtml" linear="${linear ? 'yes' : 'no'}"/>`
  }

  // `loi` is the figure pages, which follow the figures titlepage. b-ber-tasks'
  // `loi` step returns them; they used to be read from `state.loi`
  static items(data: SpineEntry[], loi: SpineEntry[]) {
    return data.reduce((acc, curr) => {
      const { fileName } = curr

      if (curr.linear === false) {
        if (!state.target.features.nonLinearSpine) {
          log.info(
            `opf templates/spine omitting non-linear asset [${fileName}] for ${state.build} build`
          )
          return acc
        }

        log.info(`opf templates/spine writing non-linear asset [${fileName}]`)
      }

      // There should be a measure in place to prevent users naming files
      // with "reserved" file names
      if (fileName === 'figures-titlepage') {
        log.info('opf templates/spine writing [loi]')

        if (loi.length) {
          return acc.concat(
            loi.reduce(
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
