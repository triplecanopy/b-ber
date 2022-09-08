const { decodeURI, encodeURI, encodeURIComponent, URLSearchParams } = window

class Url {
  static slug(str) {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
  }

  static queryStringKey(key) {
    return encodeURIComponent(key)
  }

  static queryStringValue(val) {
    return encodeURIComponent(
      val && val.constructor === Array ? JSON.stringify(val) : val
    )
  }

  static buildQueryString(data) {
    const result = []
    Object.entries(data).forEach(([key, val]) =>
      result.push(`${Url.queryStringKey(key)}=${Url.queryStringValue(val)}`)
    )
    return result.join('&')
  }

  static parseQueryString(query) {
    const params = new URLSearchParams(query)
    const result = {}
    params.forEach((val, key) => (result[key] = val))
    return result
  }

  static ensureDecodedURL(url) {
    let url_ = String(url)
    if (!url_) return url_
    while (url_ !== decodeURI(url_)) url_ = decodeURI(url_)
    return url_
  }

  static isMailTo(url) {
    return /^mailto:/.test(url)
  }

  static isRelative(url) {
    return /^http/.test(url) === false && Url.isMailTo(url) === false
  }

  static stripTrailingSlash(url) {
    return url.replace(/\/+$/, '')
  }

  static trimSlashes(path) {
    return path.replace(/(^\/+|\/+$)/g, '')
  }

  static addTrailingSlash(url) {
    return `${Url.stripTrailingSlash(url)}/`
  }

  static addLeadingSlash(url) {
    return `/${Url.trimSlashes(url)}`
  }

  static trimFilenameFromResponse(url) {
    let url_ = Url.trimSlashes(url)
    url_ = url_.slice(0, url_.lastIndexOf('/'))
    return url_
  }

  static resolveRelativeURL(url, path) {
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

  static toAbsoluteUrl(url, path) {
    const url_ = Url.stripTrailingSlash(url)
    const path_ = Url.trimSlashes(path)

    let href = `${url_}/${path_}`
    href = Url.ensureDecodedURL(href)

    return encodeURI(href)
  }

  static resolveOverlappingURL(base, path) {
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

  static stripQuery(url) {
    return url.split('?')[0]
  }

  static stripHash(url) {
    return url.split('#')[0]
  }

  static stripQueryAndHash(url) {
    let url_
    url_ = Url.stripQuery(url)
    url_ = Url.stripHash(url)
    return url_
  }

  static createPath(path) {
    let path_ = String(path)
    if (!path_ || path_ === '/') return '/'

    path_ = Url.ensureDecodedURL(path_)
    path_ = Url.stripQueryAndHash(path_)
    path_ = path_
      .split('/')
      .filter(Boolean)
      .join('/')
    path_ = path_.length ? `/${path_}/` : '/'
    return path_
  }

  // The url is on a different domain than where the reader is hosted
  static isExternal(url, cmp) {
    if (Url.isRelative(url)) {
      return false
    }

    try {
      // Create URL objects to validate the URL that was passed in and the
      // URL to reference, then compare the existence of cmp in url
      const nextUrl = new URL(url)
      const nextCmp = new URL(cmp)

      return nextUrl.href.slice(0, nextCmp.href.length) === nextCmp.href
    } catch (err) {
      // Default to `false`
      console.error(err)
      return true
    }
  }
}

export default Url
