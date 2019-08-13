import path from 'path'
import File from 'vinyl'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'

class Guide {
    static body() {
        return new File({
            path: 'guide.body.tmpl',
            contents: Buffer.from('<guide>{% body %}</guide>'),
        })
    }

    static item({ type, title, href }) {
        return `<reference type="${type}" title="${title}" href="${href}"/>`
    }

    static items(data) {
        return data.reduce((acc, curr) => {
            if (!curr.type) return acc
            log.info(`guide adding landmark [${curr.fileName}] as [${curr.type}]`)

            const { type } = curr
            const title = Html.escape(curr.title)
            const href = `text/${encodeURI(path.basename(curr.fileName, '.xhtml'))}.xhtml` // TODO: fixme

            return acc.concat(Guide.item({ type, title, href }))
        }, '')
    }
}

export default Guide
