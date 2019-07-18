import { extend, find } from 'lodash'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import { GuideItem } from '@canopycanopycanopy/b-ber-lib'
import { deepFind } from '@canopycanopycanopy/b-ber-lib/utils'

export default function markdownItFrontmatterPlugin(self) {
    return function plugin(meta) {
        const { fileName } = self
        const YAMLMeta = YamlAdaptor.parse(meta)

        state.add('guide', new GuideItem({ fileName, ...YAMLMeta }))

        const spineEntry = find(state.spine, { fileName })

        // merge the found entry in the state and spine so that we
        // can access the metadata later. since deepFind is
        // expensive, don't try unless we know that the entry
        // exists
        if (spineEntry) {
            deepFind(state.spine, fileName, item => extend(item, YAMLMeta))
            deepFind(state.toc, fileName, item => extend(item, YAMLMeta))
        }
    }
}
