export interface SpineItemOptions {
  id: string
  href: string
  mediaType: string
  properties: string[]
  idref: string
  linear: string
  absoluteURL?: string
  title?: string
  slug?: string
  depth?: number
  children?: SpineItem[]
  inTOC?: boolean
}

class SpineItem {
  id: string
  href: string
  mediaType: string
  properties: string[]
  idref: string
  linear: string
  absoluteURL: string
  title: string
  slug: string
  depth: number
  children: SpineItem[]
  inTOC: boolean

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
  }: SpineItemOptions) {
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

  set<K extends keyof this>(key: K, val: this[K]): void {
    this[key] = val
  }

  get<K extends keyof this>(key: K): this[K] {
    return this[key]
  }

  addChild(item: SpineItem): void {
    this.children.push(item)
  }
}

export default SpineItem
