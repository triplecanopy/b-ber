class SpineItem {
  constructor({
    id,
    href,
    mediaType,
    properties,
    idref,
    linear,
    absoluteURL = '',
    title = '',
    slug = '',
    depth = 0,
    children = [],
    inTOC = false,
  }) {
    this.id = id
    this.href = href
    this.mediaType = mediaType
    this.properties = properties
    this.idref = idref
    this.linear = linear
    this.absoluteURL = absoluteURL
    this.title = title
    this.slug = slug
    this.depth = depth
    this.children = children
    this.inTOC = inTOC
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
