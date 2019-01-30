/* eslint-disable no-bitwise */
import convert from 'react-attr-converter'
import quote from 'quote'
import jsStringEscape from 'js-string-escape'
import camelCase from 'camel-case'
import { isNumeric } from './Types'

const quote_ = quote({ quotes: "'" })

class Asset {
    // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
    static createHash(seed) {
        let hash = 0
        let chr
        const seed_ = String(seed)
        if (seed_.length === 0) return String(hash)
        for (let i = 0; i < seed_.length; i++) {
            chr = seed_.charCodeAt(i)
            hash = (hash << 5) - hash + chr
            hash |= 0
        }
        return String(hash)
    }
    static createId() {
        return `_${Math.random()
            .toString(36)
            .substr(2, 9)}`
    }
    static appendBookStyles(css, hash) {
        const blob = new window.Blob([css], { type: 'text/css' })
        const link = document.createElement('link')
        const head = document.querySelector('head')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.id = `_${hash}`
        link.href = window.URL.createObjectURL(blob)
        head.appendChild(link)
    }
    static removeBookStyles(hash) {
        const link = document.querySelector(`#_${hash}`)
        if (link) {
            const href = link.getAttribute('href')
            if (href && /^blob:/.test(href)) window.URL.revokeObjectURL(href)
            link.parentNode.removeChild(link)
        }
    }
    static convertToReactAttrs(attrs) {
        const attrs_ = {}
        Object.entries(attrs).forEach(([key, val]) => {
            // This will need to be updated to handle other boolen attrs not
            // covered by `convert` in case the audio/video API changes
            if (key === 'playsinline') {
                attrs_.playsInline = val
            } else {
                attrs_[convert(key)] = val
            }
        })

        if (!attrs || Object.keys(attrs).length < 1) return attrs_
        if (!attrs.style) return attrs_

        const style = {}
        const vendorPrefixes = { moz: 'Moz', webkit: 'Webkit', o: 'O' }
        const vendorPrefixRe = new RegExp('^-(moz|webkit|o)-')
        attrs.style.split(';').map(a => {
            let [key, val] = a.split(':').map(b => b.trim())
            let match = null

            if (!key || !val) return null

            match = key.match(vendorPrefixRe)

            if (match) {
                key = key.replace(vendorPrefixRe, `${vendorPrefixes[match[1]]}-`)
                key = camelCase(key)
                key = key[0].toUpperCase() + key.slice(1)
            } else {
                key = camelCase(key)
            }

            val = isNumeric(val) ? quote_(jsStringEscape(val)) : val

            style[key] = val
            return style
        })

        attrs_.style = style

        return attrs_
    }
}

export default Asset
