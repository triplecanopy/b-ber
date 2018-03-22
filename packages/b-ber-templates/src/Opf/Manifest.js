import File from 'vinyl'
import mime from 'mime-types'
import ManifestItemProperties from '@canopycanopycanopy/b-ber-lib/ManifestItemProperties'
import {fileId} from '@canopycanopycanopy/b-ber-lib/utils'

class Manifest {
    static body() {
        return new File({
            path: 'manifest.body.tmpl',
            contents: new Buffer('<manifest>{% body %}</manifest>'),
        })
    }

    static item(file) {
        const props = ManifestItemProperties.testHTML(file)
        const {name, opsPath, absolutePath, remote} = file
        return `
            <item
                id="${fileId(name)}"
                href="${encodeURI(opsPath)}"
                media-type="${!remote ? mime.lookup(absolutePath) : 'application/octet-stream'}"
                ${props && props.length ? `properties="${props.join(' ')}"` : ''}
            />
        `
    }
}

export default Manifest
