import File from 'vinyl'
import crypto from 'crypto'
import { fileId } from '@canopycanopycanopy/b-ber-lib/utils'
import Html from '@canopycanopycanopy/b-ber-lib/Html'
import ManifestItemProperties from '@canopycanopycanopy/b-ber-lib/ManifestItemProperties'

class Metadata {
    static body() {
        return new File({
            path: 'metadata.body.tmpl',
            contents: new Buffer('<metadata>{% body %}</metadata>'),
        })
    }

    static meta(data) {
        const { term, element } = ManifestItemProperties.testMeta(data)
        const itemid =
            element && data.term === 'identifier'
                ? 'uuid'
                : `_${crypto.randomBytes(20).toString('hex')}`
        const res = []
        if (term) {
            res.push(
                `<meta property="dcterms:${data.term}">${Html.escape(
                    data.value
                )}</meta>`
            )
        }
        if (element) {
            res.push(
                `<dc:${data.term} id="${itemid}">${Html.escape(
                    data.value
                )}</dc:${data.term}>`
            )
        }
        if (term && element && data.term_property && data.term_property_value) {
            res.push(
                `<meta refines="#${itemid}" property="${
                    data.term_property
                }">${Html.escape(data.term_property_value)}</meta>`
            )
        }

        if (!term && !element) {
            // meta element for the cover references the id in the manifest, so we
            // create a case to encode it properly :/
            if (data.term !== 'cover') {
                res.push(
                    `<meta name="${data.term}" content="${Html.escape(
                        data.value
                    )}"/>`
                )
            } else {
                res.push(
                    `<meta name="${data.term}" content="${fileId(
                        Html.escape(data.value)
                    )}"/>`
                )
            }
        }
        return res.join('')
    }
}

export default Metadata
