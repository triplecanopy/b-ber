import {
  type DocumentEnv,
  GuideItem,
  YamlAdaptor,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'

const isPresent = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== ''

// Collects a document's front matter: its guide item, and the metadata the
// build merges into the document's spine entry. `env` is that of the render
// that found it
export default function markdownItFrontmatterPlugin() {
  return function plugin(meta: string, env: DocumentEnv) {
    const { fileName } = env.document
    const parsed: unknown = YamlAdaptor.parse(meta)

    // Front matter that is not a mapping (empty, a list, a lone value) holds
    // no metadata. A string used to be spread into the guide item and the
    // spine entry one character per key
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
    const YAMLMeta = parsed as Record<string, unknown>

    env.result.frontMatter.push(YAMLMeta)

    // A guide item is a landmark, which front matter with a `type` declares.
    // It needs a title too, which nothing used to check: the OPF's guide then
    // read `title="undefined"` (#735). Front matter without a `type` is only
    // metadata, and its item was never written to the guide
    if (!isPresent(YAMLMeta.type)) return
    if (!isPresent(YAMLMeta.title)) {
      throw log.error(
        `Front matter in [_markdown/${fileName}.md] has a [type] but no [title]. A guide item needs both`
      )
    }

    env.result.guide.push(
      new GuideItem({
        fileName,
        ...YAMLMeta,
        title: String(YAMLMeta.title),
        type: String(YAMLMeta.type),
      })
    )
  }
}
