import jsStringEscape from 'js-string-escape'
import camelCase from 'lodash/camelCase'
import quote from 'quote'
import convert from 'react-attr-converter'
import { isNumeric } from './Types'

const quote_ = quote({ quotes: "'" })

// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
export function createHash(seed: unknown): string {
  let hash = 0
  let chr: number
  const seed_ = String(seed)
  if (seed_.length === 0) return String(hash)
  for (let i = 0; i < seed_.length; i++) {
    chr = seed_.charCodeAt(i)
    // biome-ignore lint/suspicious/noBitwiseOperators: integer hash algorithm relies on bit shifts
    hash = (hash << 5) - hash + chr
    // biome-ignore lint/suspicious/noBitwiseOperators: integer hash algorithm relies on bit shifts
    hash |= 0
  }
  // biome-ignore lint/suspicious/noBitwiseOperators: coerce to unsigned 32-bit (no negative numbers)
  hash >>>= 0 // no negative numbers
  return String(hash)
}

export function createId(): string {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function appendBookStyles(css: string, hash: string): void {
  const blob = new window.Blob([css], { type: 'text/css' })
  const link = document.createElement('link')
  const head = document.querySelector('head')

  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.id = `_${hash}`
  link.href = window.URL.createObjectURL(blob)

  head?.appendChild(link)
}

export function removeBookStyles(hash: string): void {
  const link = document.querySelector(`#_${hash}`)
  if (link) {
    const href = link.getAttribute('href')
    if (href && /^blob:/.test(href)) window.URL.revokeObjectURL(href)
    link.parentNode?.removeChild(link)
  }
}

// Accepts a loosely-typed attribute map parsed from arbitrary markup and
// returns the React-prop-cased equivalent (with parsed `style`).
// TODO: type this once call sites are typed.
export function convertToReactAttrs(
  attrs: Record<string, any>
): Record<string, any> {
  const attrs_: Record<string, any> = {}
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

  const style: Record<string, string> = {}
  const vendorPrefixes: Record<string, string> = {
    moz: 'Moz',
    webkit: 'Webkit',
    o: 'O',
  }
  const vendorPrefixRe = /^-(moz|webkit|o)-/

  attrs.style.split(';').map((a: string) => {
    let [key, val] = a.split(':').map((b: string) => b.trim())
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
