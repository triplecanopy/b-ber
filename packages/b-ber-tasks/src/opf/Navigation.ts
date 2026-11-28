import path from 'node:path'
import type {
  BuildContext,
  GuideItem,
  NavigationEntry,
  SpineItem,
  Spine as SpineModel,
} from '@canopycanopycanopy/b-ber-lib'
import { Template, YamlAdaptor } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Ncx from '@canopycanopycanopy/b-ber-templates/Ncx'
import Guide from '@canopycanopycanopy/b-ber-templates/Opf/Guide'
import Spine from '@canopycanopycanopy/b-ber-templates/Opf/Spine'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import fs from 'fs-extra'
import glob from 'glob'
import difference from 'lodash/difference'
import find from 'lodash/find'
import remove from 'lodash/remove'
import File from 'vinyl'
import { dist, src } from '../context'
import { getFileObjects } from '../inject'

// What the navigation documents and the OPF's spine and guide are made from
export interface NavigationInputs {
  spine: SpineModel
  // The nested navigation, as the build read it, before any step added to it
  toc: SpineItem[]
  guide: GuideItem[]
  // The figure pages, which follow the figures titlepage in the spine
  loi: SpineItem[]
}

class Navigation {
  // Remove the `toc.xhtml` and `toc.ncx` from the output directory
  static createEmptyNavDocuments(ctx: BuildContext) {
    const navDocs = ['toc.ncx', 'toc.xhtml']

    log.info(`opf build navigation documents [${navDocs.join(', ')}]`)

    const promises = navDocs.map((doc) => fs.writeFile(dist(ctx).ops(doc), ''))
    return Promise.all(promises)
  }

  // Resolve discrepancies between files that exist in the output directory
  // and those that are listed in the YAML manifest
  static compareXhtmlWithYaml(
    ctx: BuildContext,
    { spine, loi }: Pick<NavigationInputs, 'spine' | 'loi'>
  ) {
    // Get the XHTML file names
    const files = glob
      .sync(dist(ctx).ops('**', '*.xhtml'))
      .map((file) => path.basename(file, '.xhtml'))

    // Set up our promise chain
    const promises = [Promise.resolve()]

    const missing: string[] = []
    const redundant: string[] = []

    // Check if we need to compare agains the global toc.yml, or an
    // overrides (type.yml) file
    const { root } = src(ctx)
    const tocFile = fs.existsSync(root(`${ctx.target.name}.yml`))
      ? root(`${ctx.target.name}.yml`)
      : root('toc.yml')

    // Load the TOC from the YAML file directly. We know that the spine
    // contains the correct entries since we load any files that haven't
    // been declared in the TOC when initializing the Spine object, so no
    // need to update anything there
    const tocEntries = spine.flattenYAML(
      YamlAdaptor.load(tocFile) as NavigationEntry[]
    )

    // Files on the system that are not included in the TOC
    const missingEntries = difference(files, tocEntries)

    // Add the missing entries to the YAML file (either toc.yml or type.yml)
    missingEntries.forEach((name) => {
      if (loi.some((item) => item.name === name)) return

      const entry = spine.flattened.find((item) => item.name === name)

      let yamlString = `\n- ${name}`

      // If the entry has default attributes only write the name, otherwise
      // write the attributes along with the name
      if (entry) {
        // Get attributes that may have been dynamically added to the entry and
        // list them in the YAML
        const { linear, in_toc } = entry // eslint-disable-line camelcase
        const attributes: Record<string, boolean> = {}
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

    // Strip out the `cover` entry where the target has no cover page (pdf),
    // since the project's config.yml handles it
    if (!ctx.target.features.coverPage) {
      const coverIndex = redundantEntries.indexOf('cover')
      if (coverIndex > -1) redundantEntries.splice(coverIndex, 1)
    }

    // Notify the user of any entries that are listed in the YAML file but
    // not present on the system. The user has to resolve these conflicts
    // manually because deeply nested structures can't be reliably
    // processed.
    redundantEntries.forEach((name) => redundant.push(name))

    if (missing.length) {
      missing.forEach((name) =>
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
      message += `\nThe following entries must be removed manually from [${path.basename(
        tocFile
      )}]:`
      message += `\n${redundant.map((name) => `[${name}]`).join('\n')}`

      throw log.error(message)
    }

    return Promise.all(promises)
  }

  static async createTocStringsFromTemplate(
    ctx: BuildContext,
    toc: SpineItem[]
  ) {
    log.info('opf build [toc.xhtml]')

    const data = new File({
      contents: Buffer.from(Template.render(Toc.items(toc), Toc.body())),
    })
    const file = [{ name: 'toc.xhtml', data }]
    const [{ contents }] = await getFileObjects(ctx, file)

    return contents
  }

  static createNcxStringsFromTemplate(toc: SpineItem[]) {
    log.info('opf build [toc.ncx]')

    const ncxXML = Ncx.navPoints(toc)

    return Template.render(ncxXML, Ncx.document())
  }

  static createGuideStringsFromTemplate(guide: GuideItem[]) {
    log.info('opf build [guide]')

    const guideXML = Guide.items(guide)

    return Template.render(guideXML, Guide.body())
  }

  static createSpineStringsFromTemplate(spine: SpineModel, loi: SpineItem[]) {
    log.info('opf build [spine]')

    // In place: the steps after opf read the spine in this order
    const { flattened } = spine

    // We add entries to the spine programatically, but then they're
    // also found on the system, so we dedupe them here
    // TODO: but also, this is super confusing ...
    const generatedFiles = remove(flattened, (file) => file.generated === true)

    generatedFiles.forEach((file) => {
      if (!find(flattened, { fileName: file.fileName })) {
        flattened.push(file)
      }
    })

    const spineXML = Spine.items(flattened, loi)

    return Template.render(spineXML, Spine.body())
  }

  static writeTocXhtmlFile(ctx: BuildContext, toc: string) {
    const filepath = dist(ctx).ops('toc.xhtml')

    log.info(`opf emit toc.xhtml [${filepath}]`)

    return fs.writeFile(filepath, toc)
  }

  static writeTocNcxFile(ctx: BuildContext, ncx: string) {
    const filepath = dist(ctx).ops('toc.ncx')

    log.info(`opf emit toc.ncx [${filepath}]`)

    return fs.writeFile(filepath, ncx)
  }

  static async writeFiles(
    ctx: BuildContext,
    [toc, ncx, guide, spine]: [string, string, string, string]
  ) {
    await Promise.all([
      Navigation.writeTocXhtmlFile(ctx, toc),
      Navigation.writeTocNcxFile(ctx, ncx),
    ])
    return { spine, guide }
  }

  static init(ctx: BuildContext, { spine, toc, guide, loi }: NavigationInputs) {
    return Navigation.createEmptyNavDocuments(ctx)
      .then(() => Navigation.compareXhtmlWithYaml(ctx, { spine, loi }))
      .then(() =>
        Promise.all([
          Navigation.createTocStringsFromTemplate(ctx, toc),
          Navigation.createNcxStringsFromTemplate(toc),
          Navigation.createGuideStringsFromTemplate(guide),
          Navigation.createSpineStringsFromTemplate(spine, loi),
        ])
      )
      .then((resp) =>
        Navigation.writeFiles(ctx, resp as [string, string, string, string])
      )
      .catch((err) => {
        throw log.error(err)
      })
  }
}

export default Navigation
