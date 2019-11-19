import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import { GuideItem } from '@canopycanopycanopy/b-ber-lib'

export default function markdownItFrontmatterPlugin(self) {
  return function plugin(meta) {
    const { fileName } = self
    const YAMLMeta = YamlAdaptor.parse(meta)

    state.add('guide', new GuideItem({ fileName, ...YAMLMeta }))

    // merge the found entry in the state and spine so that we
    // can access the metadata later
    let data
    if ((data = state.spine.frontMatter.get(fileName))) {
      state.spine.frontMatter.set(fileName, { ...data, ...YAMLMeta })
    }
  }
}
