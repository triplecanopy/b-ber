import File from 'vinyl'
import find from 'lodash/find'
import has from 'lodash/has'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import { getTitle } from '@canopycanopycanopy/b-ber-lib/utils'
import state from '@canopycanopycanopy/b-ber-lib/State'

class Ncx {
    static head() {
        const entry = find(state.metadata.json(), { term: 'identifier' })
        const identifier = entry && has(entry, 'value') ? entry.value : ''
        return `
            <head>
                <meta name="dtb:uid" content="${identifier}"/>
                <meta name="dtb:depth" content="1"/>
                <meta name="dtb:totalPageCount" content="1"/>
                <meta name="dtb:maxPageNumber" content="1"/>
            </head>
        `
    }

    static title() {
        const entry = find(state.metadata.json(), { term: 'title' })
        const title = entry && has(entry, 'value') ? entry.value : ''
        return `
            <docTitle>
                <text>${Html.escape(title)}</text>
            </docTitle>
        `
    }

    static author() {
        const entry = find(state.metadata.json(), { term: 'creator' })
        const creator = entry && has(entry, 'value') ? entry.value : ''
        return `
            <docAuthor>
                <text>${Html.escape(creator)}</text>
            </docAuthor>
        `
    }

    static document() {
        return new File({
            path: 'ncx.document.tmpl',
            contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
                <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
                    ${Ncx.head()}
                    ${Ncx.title()}
                    ${Ncx.author()}
                    <navMap>
                        {% body %}
                    </navMap>
                </ncx>
            `),
        })
    }

    static navPoint(data) {
        return `
            <navLabel>
                <text>${Html.escape(getTitle(data, state))}</text>
            </navLabel>
            <content src="${data.relativePath}.xhtml" />
        `
    }

    static navPoints(data) {
        let index = 0

        function render(nodes) {
            if (!nodes || !nodes.length) return ''
            return nodes.reduce((acc, curr) => {
                if (curr.in_toc === false) return acc
                index += 1
                return acc.concat(`
                    <navPoint id="navPoint-${index}" playOrder="${index}">
                        ${Ncx.navPoint(curr)}
                        ${render(curr.nodes)}
                    </navPoint>
                `)
            }, '')
        }

        const xml = render(data)
        return xml
    }
}

export default Ncx
