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
    // Front matter is unvalidated author YAML, but GuideItem requires `title`
    // and `type`. Typing it needs a schema for front matter
    // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
    const YAMLMeta = YamlAdaptor.parse(meta) as any

    state.add('guide', new GuideItem({ fileName, ...YAMLMeta }))

    // merge the found entry in the state and spine so that we
    // can access the metadata later
    let data
    if ((data = state.spine.frontMatter.get(fileName))) {
      state.spine.frontMatter.set(fileName, { ...data, ...YAMLMeta })
    }
  }
}
