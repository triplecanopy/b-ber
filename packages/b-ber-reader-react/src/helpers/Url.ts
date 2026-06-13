// biome-ignore lint/suspicious/noShadowRestrictedNames: destructuring window's versions of these built-ins
const { decodeURI, encodeURI, encodeURIComponent, URLSearchParams } = window

class Url {
  static slug(str: unknown): string {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
  }

  static queryStringKey(key: string): string {
    return encodeURIComponent(key)
  }

  static queryStringValue(val: unknown): string {
    return encodeURIComponent(
      val && (val as object).constructor === Array
        ? JSON.stringify(val)
        : (val as string)
    )
  }

  static buildQueryString(data: Record<string, unknown>): string {
    const result: string[] = []
    Object.entries(data).forEach(([key, val]) => {
      result.push(`${Url.queryStringKey(key)}=${Url.queryStringValue(val)}`)
    })
    return result.join('&')
  }

  static parseQueryString(query: string): Record<string, string> {
    const params = new URLSearchParams(query)
    const result: Record<string, string> = {}
    params.forEach((val, key) => {
      result[key] = val
    })
    return result
  }

  static ensureDecodedURL(url: unknown): string {
    let url_ = String(url)
    if (!url_) return url_
    while (url_ !== decodeURI(url_)) url_ = decodeURI(url_)
    return url_
  }

  static isMailTo(url: string): boolean {
    return /^mailto:/.test(url)
  }

  static isRelative(url: string): boolean {
    return /^http/.test(url) === false && Url.isMailTo(url) === false
  }

  static stripTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '')
  }

  static trimSlashes(path: string): string {
    return path.replace(/(^\/+|\/+$)/g, '')
  }

  static addTrailingSlash(url: string): string {
    return `${Url.stripTrailingSlash(url)}/`
  }

  static addLeadingSlash(url: string): string {
    return `/${Url.trimSlashes(url)}`
  }

  static trimFilenameFromResponse(url: string): string {
    let url_ = Url.trimSlashes(url)
    url_ = url_.slice(0, url_.lastIndexOf('/'))
    return url_
  }

  static resolveRelativeURL(url: string, path: string): string {
    if (!url || !path) {
      console.warn(
        "Url#resolveRelativeURL: No 'url' or 'path' param provided",
        url,
        path
      )
      return '/'
    }

    const nextPath = Url.trimSlashes(path)
    let nextUrl = url

    // Test that URL is actually an URL and not a fragment. If it is,
    // then construct the complete URL based on location
    if (/^http/.test(nextUrl) !== true) {
      // Create the absolute URL
      nextUrl = Url.resolveRelativeURL(
        `${window.location.origin}${window.location.pathname}`,
        nextUrl
      )

      // Return the result of the absolute URL with the original path
      return Url.resolveRelativeURL(nextUrl, nextPath)
    }

    nextUrl = Url.addTrailingSlash(url)

    let { href } = new window.URL(nextPath, nextUrl)
    href = Url.ensureDecodedURL(href)
    return encodeURI(href)
  }

  static toAbsoluteUrl(url: string, path: string): string {
    const url_ = Url.stripTrailingSlash(url)
    const path_ = Url.trimSlashes(path)

    let href = `${url_}/${path_}`
    href = Url.ensureDecodedURL(href)

    return encodeURI(href)
  }

  static resolveOverlappingURL(base: string, path: string): string {
    const base_ = new window.URL(base)
    const path_ = Url.trimSlashes(path).split('/')
    const { origin, pathname } = base_
    const basePathName = Url.trimSlashes(pathname).split('/')
    basePathName.pop() // we know it's a file name, so we can already pop the last entry

    for (let i = basePathName.length - 1; i >= 0; i--) {
      if (basePathName[i] === path_[0]) {
        path_.shift()
      }
    }

    const urlPath = [...basePathName, ...path_].join('/')
    const { href } = new window.URL(Url.ensureDecodedURL(urlPath), origin)

    return encodeURI(href)
  }

  static stripQuery(url: string): string {
    return url.split('?')[0]
  }

  static stripHash(url: string): string {
    return url.split('#')[0]
  }

  static stripQueryAndHash(url: string): string {
    let url_
    url_ = Url.stripQuery(url)
    url_ = Url.stripHash(url)
    return url_
  }

  static createPath(path: unknown): string {
    let path_ = String(path)
    if (!path_ || path_ === '/') return '/'

    path_ = Url.ensureDecodedURL(path_)
    path_ = Url.stripQueryAndHash(path_)
    path_ = path_.split('/').filter(Boolean).join('/')
    path_ = path_.length ? `/${path_}/` : '/'
    return path_
  }

  // The url is on a different domain than where the reader is hosted
  static isExternal(url: string, cmp: string): boolean {
    if (Url.isRelative(url)) {
      return false
    }

    try {
      // Create URL objects to validate the URL that was passed in and the
      // URL to reference, then compare the existence of cmp in url
      const { host: urlHost } = new URL(url)
      const { host: cmpHost } = new URL(cmp)

      return urlHost !== cmpHost
    } catch (err) {
      console.error(err)
      return true
    }
  }
}

export default Url
