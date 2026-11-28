import {
  type DocumentEnv,
  GuideItem,
  YamlAdaptor,
} from '@canopycanopycanopy/b-ber-lib'

// Collects a document's front matter: its guide item, and the metadata the
// build merges into the document's spine entry. `env` is that of the render
// that found it
export default function markdownItFrontmatterPlugin() {
  return function plugin(meta: string, env: DocumentEnv) {
    const { fileName } = env.document
    // Unvalidated author YAML
    const YAMLMeta = YamlAdaptor.parse(meta) as Record<string, unknown>

    // Defect, see #735: GuideItem requires `title` and `type`, which nothing
    // checks the front matter has. The cast keeps the call as it is until then
    env.result.guide.push(
      new GuideItem({ fileName, ...YAMLMeta } as ConstructorParameters<
        typeof GuideItem
      >[0])
    )

    env.result.frontMatter.push(YAMLMeta)
  }
}
