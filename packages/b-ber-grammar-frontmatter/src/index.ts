import {
  GuideItem,
  State as state,
  YamlAdaptor,
} from '@canopycanopycanopy/b-ber-lib'

// `self` is b-ber-markdown-renderer's MarkdownRenderer, which cannot be
// imported here without a dependency cycle
export default function markdownItFrontmatterPlugin(self: {
  fileName: string
}) {
  return function plugin(meta: string) {
    const { fileName } = self
    // Unvalidated author YAML
    const YAMLMeta = YamlAdaptor.parse(meta) as Record<string, unknown>

    // Defect, see #735: GuideItem requires `title` and `type`, which nothing
    // checks the front matter has. The cast keeps the call as it is until then
    state.add(
      'guide',
      new GuideItem({ fileName, ...YAMLMeta } as ConstructorParameters<
        typeof GuideItem
      >[0])
    )

    // merge the found entry in the state and spine so that we
    // can access the metadata later
    let data
    if ((data = state.spine.frontMatter.get(fileName))) {
      state.spine.frontMatter.set(fileName, { ...data, ...YAMLMeta })
    }
  }
}
