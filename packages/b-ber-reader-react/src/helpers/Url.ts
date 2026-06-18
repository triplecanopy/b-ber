// biome-ignore lint/suspicious/noShadowRestrictedNames: destructuring window's versions of these built-ins
const { decodeURI, encodeURI, encodeURIComponent, URLSearchParams } = window

export function slug(str: unknown): string {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
}

export function queryStringKey(key: string): string {
  return encodeURIComponent(key)
}

export function queryStringValue(val: unknown): string {
  return encodeURIComponent(
    val && (val as object).constructor === Array
      ? JSON.stringify(val)
      : (val as string)
  )
}

export function buildQueryString(data: Record<string, unknown>): string {
  const result: string[] = []
  Object.entries(data).forEach(([key, val]) => {
    result.push(`${queryStringKey(key)}=${queryStringValue(val)}`)
  })
  return result.join('&')
}

export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query)
  const result: Record<string, string> = {}
  params.forEach((val, key) => {
    result[key] = val
  })
  return result
}

export function ensureDecodedURL(url: unknown): string {
  let url_ = String(url)
  if (!url_) return url_
  while (url_ !== decodeURI(url_)) url_ = decodeURI(url_)
  return url_
}

export function isMailTo(url: string): boolean {
  return /^mailto:/.test(url)
}

export function isRelative(url: string): boolean {
  return /^http/.test(url) === false && isMailTo(url) === false
}

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function trimSlashes(path: string): string {
  return path.replace(/(^\/+|\/+$)/g, '')
}

export function addTrailingSlash(url: string): string {
  return `${stripTrailingSlash(url)}/`
}

export function addLeadingSlash(url: string): string {
  return `/${trimSlashes(url)}`
}

export function trimFilenameFromResponse(url: string): string {
  let url_ = trimSlashes(url)
  url_ = url_.slice(0, url_.lastIndexOf('/'))
  return url_
}

export function resolveRelativeURL(url: string, path: string): string {
  if (!url || !path) {
    console.warn(
      "Url#resolveRelativeURL: No 'url' or 'path' param provided",
      url,
      path
    )
    return '/'
  }

  const nextPath = trimSlashes(path)
  let nextUrl = url

  // Test that URL is actually an URL and not a fragment. If it is,
  // then construct the complete URL based on location
  if (/^http/.test(nextUrl) !== true) {
    // Create the absolute URL
    nextUrl = resolveRelativeURL(
      `${window.location.origin}${window.location.pathname}`,
      nextUrl
    )

    // Return the result of the absolute URL with the original path
    return resolveRelativeURL(nextUrl, nextPath)
  }

  nextUrl = addTrailingSlash(url)

  let { href } = new window.URL(nextPath, nextUrl)
  href = ensureDecodedURL(href)
  return encodeURI(href)
}

export function toAbsoluteUrl(url: string, path: string): string {
  const url_ = stripTrailingSlash(url)
  const path_ = trimSlashes(path)

  let href = `${url_}/${path_}`
  href = ensureDecodedURL(href)

  return encodeURI(href)
}

export function resolveOverlappingURL(base: string, path: string): string {
  const base_ = new window.URL(base)
  const path_ = trimSlashes(path).split('/')
  const { origin, pathname } = base_
  const basePathName = trimSlashes(pathname).split('/')
  basePathName.pop() // we know it's a file name, so we can already pop the last entry

  for (let i = basePathName.length - 1; i >= 0; i--) {
    if (basePathName[i] === path_[0]) {
      path_.shift()
    }
  }

  const urlPath = [...basePathName, ...path_].join('/')
  const { href } = new window.URL(ensureDecodedURL(urlPath), origin)

  return encodeURI(href)
}

export function stripQuery(url: string): string {
  return url.split('?')[0]
}

export function stripHash(url: string): string {
  return url.split('#')[0]
}

export function stripQueryAndHash(url: string): string {
  let url_
  url_ = stripQuery(url)
  url_ = stripHash(url)
  return url_
}

export function createPath(path: unknown): string {
  let path_ = String(path)
  if (!path_ || path_ === '/') return '/'

  path_ = ensureDecodedURL(path_)
  path_ = stripQueryAndHash(path_)
  path_ = path_.split('/').filter(Boolean).join('/')
  path_ = path_.length ? `/${path_}/` : '/'
  return path_
}

// The url is on a different domain than where the reader is hosted
export function isExternal(url: string, cmp: string): boolean {
  if (isRelative(url)) {
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
