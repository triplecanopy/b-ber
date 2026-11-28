// TASK-161's element builder and XHTML serializer (TASK-176). The directives'
// markup is built as a tree and written once, so every element is closed
// where it is opened: a block's `</section>` can no longer come from a
// different render call than its `<section>`.
//
// It imports nothing, so the grammars can be handed it (`h`) and the
// consolidated package (TASK-179) can take it as it is. The node types are
// b-ber-lib's, where the grammars can see them.
//
// One way of writing each thing, chosen to match the markup the grammars
// wrote by hand:
// - attributes are `name="value"`, one space before each, escaped as
//   b-ber-lib's `Html.escape` escapes them (`& < > " '`);
// - a void element is `<img src="…"/>`, with no space before the `/`;
// - any other element is opened and closed, even when it is empty
//   (`<iframe></iframe>`): in HTML, which the web target is read as,
//   `<iframe/>` does not close;
// - text escapes `& < >`;
// - a comment is `<!-- value -->`. `--` cannot occur in an XML comment, so
//   it is written `- -`.

import type {
  XhtmlAttributes,
  XhtmlBuilder,
  XhtmlChild,
  XhtmlComment,
  XhtmlElement,
  XhtmlFragment,
  XhtmlNode,
  XhtmlRaw,
  XhtmlText,
} from '@canopycanopycanopy/b-ber-lib'

export type { XhtmlBuilder, XhtmlNode }

// HTML's void elements, which have no end tag
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const ATTRIBUTE_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const escapeAttribute = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ATTRIBUTE_ESCAPES[c])

const escapeText = (value: string): string =>
  value.replace(/[&<>]/g, (c) => ATTRIBUTE_ESCAPES[c])

const text = (value: string): XhtmlText => ({ type: 'text', value })
const raw = (html: string): XhtmlRaw => ({ type: 'raw', html })
const comment = (value: string): XhtmlComment => ({ type: 'comment', value })

const nodes = (children: XhtmlChild[]): XhtmlNode[] => {
  const out: XhtmlNode[] = []
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    out.push(typeof child === 'string' ? text(child) : child)
  }
  return out
}

const fragment = (children: XhtmlChild[]): XhtmlFragment => ({
  type: 'fragment',
  children: nodes(children),
})

const attributes = (attrs: XhtmlAttributes | null): [string, string][] => {
  if (!attrs) return []
  const entries = Array.isArray(attrs) ? attrs : Object.entries(attrs)
  const out: [string, string][] = []
  for (const [name, value] of entries) {
    if (value === null || value === undefined || value === false) continue
    out.push([name, String(value)])
  }
  return out
}

const element = (
  tag: string,
  attrs: XhtmlAttributes | null = null,
  children: XhtmlChild[] = []
): XhtmlElement => ({
  type: 'element',
  tag,
  attrs: attributes(attrs),
  children: nodes(children),
})

export const h: XhtmlBuilder = Object.assign(element, {
  text,
  raw,
  comment,
  fragment,
})

export function serialize(node: XhtmlNode): string {
  switch (node.type) {
    case 'text':
      return escapeText(node.value)
    case 'raw':
      return node.html
    case 'comment':
      return `<!-- ${node.value.replace(/-(?=-)/g, '- ')} -->`
    case 'fragment':
      return node.children.map(serialize).join('')
    default: {
      const attrs = node.attrs
        .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
        .join('')
      if (VOID.has(node.tag) && node.children.length === 0)
        return `<${node.tag}${attrs}/>`
      return `<${node.tag}${attrs}>${node.children.map(serialize).join('')}</${node.tag}>`
    }
  }
}
