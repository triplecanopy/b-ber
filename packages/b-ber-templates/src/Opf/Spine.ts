import {
  type SpineItem,
  State as state,
  utils,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import path from 'path'
import File from 'vinyl'

const { fileId } = utils

// A spine entry, from `state.spine.flattened` or `state.loi`
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

  static items(data: SpineEntry[]) {
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

      // There should be a measure in place to prevent users naming files
      // with "reserved" file names
      if (fileName === 'figures-titlepage') {
        log.info('opf templates/spine writing [loi]')

        if (state.loi.length) {
          return acc.concat(
            // b-ber-tasks' `loi` task fills `state.loi` with SpineItems
            (state.loi as SpineItem[]).reduce(
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
