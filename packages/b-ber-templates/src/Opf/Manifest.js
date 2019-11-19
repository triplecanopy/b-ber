import File from 'vinyl'
import mime from 'mime-types'
import ManifestItemProperties from '@canopycanopycanopy/b-ber-lib/ManifestItemProperties'
import { fileId } from '@canopycanopycanopy/b-ber-lib/utils'

const getProps = file => {
  const props = ManifestItemProperties.testHTML(file)
  return props && props.length ? `properties="${props.join(' ')}"` : ''
}

const getMediaType = ({ remote, absolutePath }) =>
  remote ? 'application/octet-stream' : mime.lookup(absolutePath)

class Manifest {
  static body() {
    return new File({
      path: 'manifest.body.tmpl',
      contents: Buffer.from('<manifest>{% body %}</manifest>'),
    })
  }

  static item(file) {
    const id = fileId(file.name)
    const href = encodeURI(file.opsPath)
    const mediaType = getMediaType(file)
    const props = getProps(file)

    return `<item id="${id}" href="${href}" media-type="${mediaType}" ${props}/>`
  }
}

export default Manifest
