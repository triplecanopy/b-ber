import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import { SpineItem, Template } from '@canopycanopycanopy/b-ber-lib'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

class Footnotes {
  get file() {
    return {
      name: this.baseName,
      path: state.dist.text(`${this.baseName}.xhtml`),
    }
  }

  constructor() {
    this.baseName = 'notes'
    this.init = this.init.bind(this)
  }

  writeFootnotes() {
    const notes = state.footnotes.reduce(
      (acc, cur) => acc.concat(cur.notes),
      ''
    )
    const markup = Template.render(notes, Xhtml.body())

    return fs.writeFile(this.file.path, markup, 'utf8').then(() => {
      const fileData = new SpineItem({
        fileName: this.file.name,
        // eslint-disable-next-line camelcase
        in_toc: false,
        linear: false,
        generated: true,
        buildType: state.build,
      })

      state.add('spine.flattened', fileData)
      log.info(`create default footnotes page [${this.file.name}.xhtml]`)
    })
  }

  init() {
    if (!state.footnotes.length) {
      log.info('footnotes no footnotes found in source')
      return Promise.resolve(state.footnotes)
    }

    log.info('footnotes generating links')

    return this.writeFootnotes().catch(log.error)
  }
}

const footnotes = new Footnotes()
export default footnotes.init
