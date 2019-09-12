class Url {
    static trimSlashes(url) {
        return url.replace(/(^\/+|\/+$)/, '')
    }

    static removeTrailingSlash = str => {
        if (typeof str !== 'string') return ''
        return str.replace(/\/+$/, '')
    }

    static addTrailingSlash = str => {
        if (typeof str !== 'string' || str === '/') return '/'
        return `${Url.removeTrailingSlash(str)}/`
    }

    static ensureDecoded(str) {
        let str_ = str
        while (decodeURIComponent(str_) !== str_) {
            str_ = decodeURIComponent(str_)
        }
        return str_
    }

    static encodeQueryString(url) {
        let url_ = url.split('?')
        const loc = url_[0]
        let qs = url_[1]

        if (!qs) return loc

        qs = Url.ensureDecoded(qs)
        qs = encodeURIComponent(qs)
        url_ = `${loc}?${qs}`
        return url_
    }
}

export default Url
