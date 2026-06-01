class Url {
  static trimSlashes(url: string): string {
    return url.replace(/(^\/+|\/+$)/, '')
  }

  static removeTrailingSlash = (str: string): string => {
    if (typeof str !== 'string') return ''
    return str.replace(/\/+$/, '')
  }

  static addTrailingSlash = (str: string): string => {
    if (typeof str !== 'string' || str === '/') return '/'
    return `${Url.removeTrailingSlash(str)}/`
  }

  static ensureDecoded(str: string): string {
    let str_ = str
    while (decodeURIComponent(str_) !== str_) {
      str_ = decodeURIComponent(str_)
    }
    return str_
  }

  static encodeQueryString(url: string): string {
    const parts = url.split('?')
    const loc = parts[0]
    let qs = parts[1]

    if (!qs) return loc

    qs = Url.ensureDecoded(qs)
    qs = encodeURIComponent(qs)
    return `${loc}?${qs}`
  }
}

export default Url
