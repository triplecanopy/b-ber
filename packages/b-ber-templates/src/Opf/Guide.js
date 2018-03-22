import File from 'vinyl'
import {escapeHTML} from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'

class Guide {
    static body() {
        return new File({
            path: 'guide.body.tmpl',
            contents: new Buffer('<guide>{% body %}</guide>'),
        })
    }

    static item({type, title, href}) {
        return `<reference type="${type}" title="${title}" href="${href}"/>`
    }
    static items(data) {
        return data.map(a => {
            let item = ''
            let type
            if ((type = a.type)) {

                log.info(`Adding landmark [${a.fileName}] as [${type}]`)

                const title = escapeHTML(a.title)
                const href = `${encodeURI(a.relativePath)}.xhtml`
                item = Guide.item({type, title, href})
            }

            return item
        }).join('')
    }
}

export default Guide
