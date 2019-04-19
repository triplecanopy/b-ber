/* eslint-disable camelcase */

import path from 'path'

class SpineItem {
    static isNavigationDocument(fileName) {
        return fileName === 'toc' || fileName === 'nav'
    }

    constructor({ fileName, in_toc, linear, generated, pageOrder, buildType }) {
        // TODO: rename name baseName
        // TODO: fileName has an extension in some cases, other times not (only seen in inject/index.js so far). this needs to be verified
        // TODO: should contain separate fields for input and output name (i.e., .md and .xhtml)
        // @issue: https://github.com/triplecanopy/b-ber/issues/207

        this.fileName = fileName
        this.relativePath = SpineItem.isNavigationDocument(this.fileName) // relative to OPS
            ? this.fileName
            : path.join('text', this.fileName)
        this.absolutePath = path.resolve(`project-${buildType}`, 'OPS', this.relativePath)
        this.extension = path.extname(this.fileName)
        this.name = path.basename(this.fileName, this.extension)
        this.remotePath = ''
        this.type = ''
        this.title = fileName[0].toUpperCase() + fileName.slice(1)
        this.pageOrder = typeof pageOrder === 'number' ? pageOrder : -1
        this.in_toc = typeof in_toc === 'boolean' ? in_toc : true
        this.linear = typeof linear === 'boolean' ? linear : true
        this.generated = Boolean(generated)
        this.nodes = []
        this.ref = null // TODO: what's this? @issue: https://github.com/triplecanopy/b-ber/issues/207
    }
}

export default SpineItem
