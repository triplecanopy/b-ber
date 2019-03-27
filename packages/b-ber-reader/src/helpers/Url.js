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

    static buildQueryString(data) {
        const result = []
        Object.entries(data).forEach(([key, val]) =>
            result.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(
                    val && val.constructor === Array ? JSON.stringify(val) : val,
                )}`,
            ),
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

    static isRelativeURL(url) {
        return /^http/.test(url) === false
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

    static trimFilenameFromResponse(url) {
        let url_ = Url.trimSlashes(url)
        url_ = url_.slice(0, url_.lastIndexOf('/'))
        return url_
    }

    static resolveRelativeURL(url, path) {
        if (!url || !path) {
            console.warn("Url#resolveRelativeURL: No 'url' or 'path' param provided", url, path)
            return '/'
        }

        const url_ = Url.addTrailingSlash(url)
        const path_ = Url.trimSlashes(path)

        let { href } = new window.URL(path_, url_)
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

    static isExternalURL(url) {
        if (Url.isRelativeURL(url)) return false
        const url_ = new window.URL(url)
        return window.location.origin !== url_.origin
    }
}

export default Url
