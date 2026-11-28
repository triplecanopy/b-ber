import {
  type BuildContext,
  type FootnotesEntry,
  type Spine,
  SpineItem,
  Template,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import { dist, distDir } from '../context'

const BASE_NAME = 'notes'

// Writes every document's footnotes to one page, `notes.xhtml`, and adds it to
// the end of the spine, out of the reading order. Resolves to the page, or to
// nothing when the book has no footnotes
async function footnotes(
  ctx: BuildContext,
  { footnotes: entries, spine }: { footnotes: FootnotesEntry[]; spine: Spine }
): Promise<SpineItem | undefined> {
  if (!entries.length) {
    log.info('footnotes no footnotes found in source')
    return undefined
  }

  log.info('footnotes generating links')

  try {
    const notes = entries.reduce<string>(
      (acc, cur) => acc.concat(cur.notes),
      ''
    )
    const markup = Template.render(notes, Xhtml.body())
    await fs.writeFile(dist(ctx).text(`${BASE_NAME}.xhtml`), markup, 'utf8')

    const page = new SpineItem({
      fileName: BASE_NAME,
      // eslint-disable-next-line camelcase
      in_toc: false,
      linear: false,
      generated: true,
      dist: distDir(ctx),
    })

    // A new list, as `state.add` made it
    spine.flattened = [...spine.flattened, page]
    log.info(`create default footnotes page [${BASE_NAME}.xhtml]`)

    return page
  } catch (err) {
    throw log.error(err)
  }
}

export default footnotes
