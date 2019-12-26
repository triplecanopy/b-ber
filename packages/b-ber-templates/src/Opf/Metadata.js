import File from 'vinyl'
import crypto from 'crypto'
import { fileId } from '@canopycanopycanopy/b-ber-lib/utils'
import Html from '@canopycanopycanopy/b-ber-lib/Html'
import ManifestItemProperties from '@canopycanopycanopy/b-ber-lib/ManifestItemProperties'
import log from '@canopycanopycanopy/b-ber-logger'

class Metadata {
  static uid() {
    return `_${crypto.randomBytes(8).toString('hex')}`
  }

  static body() {
    return new File({
      path: 'metadata.body.tmpl',
      contents: Buffer.from('<metadata>{% body %}</metadata>'),
    })
  }

  static meta(data) {
    const { term, element } = ManifestItemProperties.testMeta(data)
    const itemid =
      element && data.term === 'identifier' ? 'uuid' : Metadata.uid()

    let res = []

    if (term) {
      res.push(
        `<meta property="dcterms:${data.term}">${Html.escape(
          data.value
        )}</meta>`
      )
    }

    if (element) {
      res.push(
        `<dc:${data.term} id="${itemid}">${Html.escape(data.value)}</dc:${
          data.term
        }>`
      )
    }

    // Create up `refines` meta elements. Support for legacy below
    if (data.refines) {
      const refines = data.refines.reduce(
        (acc, curr) =>
          acc.concat(
            Object.entries(curr).map(
              ([key, value]) =>
                `<meta refines="#${itemid}" property="${key}">${Html.escape(
                  value
                )}</meta>`
            )
          ),
        []
      )

      res = res.concat(refines)
    }

    // @deprecated
    if (term && element && data.term_property && data.term_property_value) {
      let message = '\n'
      message +=
        "You're using an outdated syntax in `metadata.yml` which will be removed in future versions."
      message +=
        '\nUpdate the entries in the `metadata.yml` file to use the new `refines` syntax:'

      message += `

                  -   - term: ${data.term}
                  -     value: ${data.value}
                  -     term_property: ${data.term_property}
                  -     term_property_value: ${data.term_property_value}
                  +    - term: ${data.term}
                  +      value: ${data.value}
                  +      - refines:
                  +        - ${data.term_property}: ${data.term_property_value}
                  `

      log.notice(message)

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
          `<meta name="${data.term}" content="${Html.escape(data.value)}"/>`
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
