import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import glob from 'glob'
import find from 'lodash/find'
import difference from 'lodash/difference'
import remove from 'lodash/remove'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import Ncx from '@canopycanopycanopy/b-ber-templates/Ncx'
import Guide from '@canopycanopycanopy/b-ber-templates/Opf/Guide'
import Spine from '@canopycanopycanopy/b-ber-templates/Opf/Spine'
import { YamlAdaptor, Template } from '@canopycanopycanopy/b-ber-lib'
import { getFileObjects } from '../inject'

class Navigation {
  // Remove the `toc.xhtml` and `toc.ncx` from the output directory
  static createEmptyNavDocuments() {
    const navDocs = ['toc.ncx', 'toc.xhtml']

    log.info(`opf build navigation documents [${navDocs.join(', ')}]`)

    const promises = navDocs.map(doc => fs.writeFile(state.dist.ops(doc), ''))
    return Promise.all(promises)
  }

  // Resolve discrepancies between files that exist in the output directory
  // and those that are listed in the YAML manifest
  static compareXhtmlWithYaml() {
    // Get the XHTML file names
    const files = glob
      .sync(state.dist.ops('**', '*.xhtml'))
      .map(file => path.basename(file, '.xhtml'))

    // Set up our promise chain
    const promises = [Promise.resolve()]

    const missing = []
    const redundant = []

    // Check if we need to compare agains the global toc.yml, or an
    // overrides (type.yml) file
    const tocFile = fs.existsSync(state.src.root(`${state.build}.yml`))
      ? state.src.root(`${state.build}.yml`)
      : state.src.root('toc.yml')

    // Load the TOC from the YAML file directly. We know that the spine
    // contains the correct entries since we load any files that haven't
    // been declared in the TOC when initializing the Spine object, so no
    // need to update anything there
    const tocEntries = state.spine.flattenYAML(YamlAdaptor.load(tocFile))

    // Files on the system that are not included in the TOC
    const missingEntries = difference(files, tocEntries)

    // Add the missing entries to the YAML file (either toc.yml or type.yml)
    missingEntries.forEach(name => {
      if (state.contains('loi', { name })) return

      const entry = state.find('spine.flattened', { name })

      let yamlString = `\n- ${name}`

      // If the entry has default attributes only write the name, otherwise
      // write the attributes along with the name
      if (entry) {
        // Get attributes that may have been dynamically added to the entry and
        // list them in the YAML
        const { linear, in_toc } = entry // eslint-disable-line camelcase
        const attributes = {}
        if (linear === false) attributes.linear = false
        if (in_toc === false) attributes.in_toc = false // eslint-disable-line camelcase

        if (Object.keys(attributes).length) {
          const space = '\n    '
          yamlString += ':'
          yamlString = Object.entries(attributes).reduce(
            (acc, [key, val]) => acc.concat(`${space}${key}: ${val}`),
            yamlString
          )
        }
      }

      missing.push(name)
      promises.push(fs.appendFile(tocFile, yamlString))
    })

    // Files in the TOC that don't exist in the project directory
    const redundantEntries = difference(tocEntries, files)

    // Notify the user of any entries that are listed in the YAML file but
    // not present on the system. The user has to resolve these conflicts
    // manually because deeply nested structures can't be reliably
    // processed.
    redundantEntries.forEach(name => redundant.push(name))

    if (missing.length) {
      missing.forEach(name =>
        log.warn(
          'opf [%s] was not declared in the TOC. Adding [%s] to [%s]',
          name,
          name,
          path.basename(tocFile)
        )
      )
    }

    if (redundant.length) {
      let message =
        'Files declared in the TOC do not exist in the _markdown directory'
      message += 'The following entries must be removed manually from '
      message += `[${path.basename(tocFile)}]:`
      message += redundant.map(name => `[${name}]`).join('\n')

      log.error(message)
    }

    return Promise.all(promises)
  }

  static async createTocStringsFromTemplate() {
    log.info('opf build [toc.xhtml]')

    const { toc } = state
    const data = new File({
      contents: Buffer.from(Template.render(Toc.items(toc), Toc.body())),
    })
    const file = [{ name: 'toc.xhtml', data }]
    const [{ contents }] = await getFileObjects(file)

    return contents
  }

  static createNcxStringsFromTemplate() {
    log.info('opf build [toc.ncx]')

    const { toc } = state
    const ncxXML = Ncx.navPoints(toc)

    return Template.render(ncxXML, Ncx.document())
  }

  static createGuideStringsFromTemplate() {
    log.info('opf build [guide]')

    const guideXML = Guide.items(state.guide)

    return Template.render(guideXML, Guide.body())
  }

  static createSpineStringsFromTemplate() {
    log.info('opf build [spine]')

    const { flattened } = state.spine

    // We add entries to the spine programatically, but then they're
    // also found on the system, so we dedupe them here
    // TODO: but also, this is super confusing ...
    const generatedFiles = remove(flattened, file => file.generated === true)

    generatedFiles.forEach(file => {
      if (!find(flattened, { fileName: file.fileName })) {
        flattened.push(file)
      }
    })

    const spineXML = Spine.items(flattened)

    return Template.render(spineXML, Spine.body())
  }

  static writeTocXhtmlFile(toc) {
    const filepath = state.dist.ops('toc.xhtml')

    log.info(`opf emit toc.xhtml [${filepath}]`)

    return fs.writeFile(filepath, toc)
  }

  static writeTocNcxFile(ncx) {
    const filepath = state.dist.ops('toc.ncx')

    log.info(`opf emit toc.ncx [${filepath}]`)

    return fs.writeFile(filepath, ncx)
  }

  static async writeFiles([toc, ncx, guide, spine]) {
    await Promise.all([
      Navigation.writeTocXhtmlFile(toc),
      Navigation.writeTocNcxFile(ncx),
    ])
    return { spine, guide }
  }

  static init() {
    return Navigation.createEmptyNavDocuments()
      .then(() => Navigation.compareXhtmlWithYaml())
      .then(() =>
        Promise.all([
          Navigation.createTocStringsFromTemplate(),
          Navigation.createNcxStringsFromTemplate(),
          Navigation.createGuideStringsFromTemplate(),
          Navigation.createSpineStringsFromTemplate(),
        ])
      )
      .then(resp => Navigation.writeFiles(resp))
      .catch(log.error)
  }
}

export default Navigation
