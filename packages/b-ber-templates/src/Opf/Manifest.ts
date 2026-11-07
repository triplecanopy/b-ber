import { ManifestItemProperties, utils } from '@canopycanopycanopy/b-ber-lib'
import mime from 'mime-types'
import File from 'vinyl'

const { fileId } = utils

// A file to list in the manifest, as b-ber-tasks' opf `pathInfoFromFile`
// describes it
interface ManifestEntry {
  absolutePath: string
  // Path relative to the OPS directory, or the URL of a remote asset
  opsPath: string
  name: string
  remote: boolean
}

const getProps = (file: ManifestEntry) => {
  const props = ManifestItemProperties.testHTML(file)
  return props && props.length ? `properties="${props.join(' ')}"` : ''
}

const getMediaType = ({
  remote,
  absolutePath,
}: Pick<ManifestEntry, 'remote' | 'absolutePath'>) =>
  remote ? 'application/octet-stream' : mime.lookup(absolutePath)

class Manifest {
  static body() {
    return new File({
      path: 'manifest.body.tmpl',
      contents: Buffer.from('<manifest>{% body %}</manifest>'),
    })
  }

  static item(file: ManifestEntry) {
    const id = fileId(file.name)
    const href = encodeURI(file.opsPath)
    const mediaType = getMediaType(file)
    const props = getProps(file)

    return `<item id="${id}" href="${href}" media-type="${mediaType}" ${props}/>`
  }
}

export default Manifest
