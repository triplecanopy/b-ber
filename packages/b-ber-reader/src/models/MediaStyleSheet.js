class MediaStyleSheet {
    constructor({id, query, rules}) {
        this.id = id || `_${String(Math.random()).slice(2)}`
        this.query = query
        this.rules = rules
    }

    insertRules(doc, elem) {
        this.rules.forEach(a =>
            elem.appendChild(
                doc.createTextNode(`${a.selector} { ${a.declarations.join(';')} }`)
            )
        )
    }

    appendSheet(doc) {
        const elem = doc.createElement('style')

        elem.setAttribute('id', this.id)
        elem.setAttribute('media', this.query)
        elem.appendChild(doc.createTextNode('')) // WebKit hack

        this.insertRules(doc, elem)
        doc.body.appendChild(elem)
    }

}

export default MediaStyleSheet
