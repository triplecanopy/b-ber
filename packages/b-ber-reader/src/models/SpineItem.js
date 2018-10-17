class SpineItem {
    constructor({ id, href, mediaType, properties, idref, linear }) {
        this.id = id
        this.href = href
        this.mediaType = mediaType
        this.properties = properties
        this.idref = idref
        this.linear = linear
        this.absoluteURL = ''
        this.title = ''
        this.slug = ''
        this.depth = 0
        this.children = []
    }

    set(key, val) {
        this[key] = val
    }
    get(key) {
        return this[key]
    }

    addChild(item) {
        this.children.push(item)
    }
}

export default SpineItem
