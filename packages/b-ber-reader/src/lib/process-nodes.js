import React from 'react'
import has from 'lodash/has'
import isUndefined from 'lodash/isUndefined'
import { ProcessNodeDefinitions } from 'html-to-react'
import {
  Link,
  Footnote,
  Spread,
  Marker,
  Audio,
  Video,
  SpreadFigure,
  Vimeo,
  Ultimate,
} from '../components'
import { Asset, Url } from '../helpers'

export const isValidNode = () => true
export const processNodeDefinitions = new ProcessNodeDefinitions(React)
export const processingInstructions = ({ requestedSpineItem /*, opsURL*/ }) => [
  {
    shouldProcessNode(node) {
      return node?.attribs?.['epub:type'] === 'noteref'
    },
    processNode(node, children) {
      const href = Url.resolveOverlappingURL(
        requestedSpineItem.absoluteURL,
        node.attribs.href
      )

      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = attrs.href

      return React.createElement(Footnote, { ...attrs, key, href }, children)
    },
  },
  {
    shouldProcessNode(node) {
      return node.attribs && node.attribs.href
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = attrs.href

      let { href } = node.attribs
      if (Url.isRelative(node.attribs.href)) {
        href = Url.resolveOverlappingURL(
          requestedSpineItem.absoluteURL,
          node.attribs.href
        )
      }

      return React.createElement(Link, { ...attrs, key, href }, children)
    },
  },
  {
    shouldProcessNode(node) {
      return (
        /^(img|source)$/.test(node.name) &&
        node.attribs &&
        node.attribs.src &&
        Url.isRelative(node.attribs.src)
      )
    },
    processNode(node) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = attrs.src
      const src = Url.resolveOverlappingURL(
        requestedSpineItem.absoluteURL,
        node.attribs.src
      )

      return React.createElement(node.name, { ...attrs, key, src })
    },
  },
  {
    shouldProcessNode(node) {
      return node.name === 'audio'
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const { id, autoPlay, controls } = attrs
      const key = id

      let dataAutoPlay = false
      if (!isUndefined(autoPlay)) {
        dataAutoPlay = true
        delete attrs.autoPlay
      }

      return React.createElement(
        Audio,
        {
          ...attrs,
          'data-autoplay': dataAutoPlay,
          controls: !isUndefined(controls),
          key,
        },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return node.name === 'video'
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const { id, autoPlay, controls } = attrs
      const key = id

      const poster = node.attribs.poster
        ? Url.resolveOverlappingURL(
            requestedSpineItem.absoluteURL,
            node.attribs.poster
          )
        : null

      let dataAutoPlay = false
      if (!isUndefined(autoPlay)) {
        dataAutoPlay = true
        delete attrs.autoPlay
      }

      return React.createElement(
        Video,
        {
          ...attrs,
          'data-autoplay': dataAutoPlay,
          controls: !isUndefined(controls),
          key,
          poster,
        },
        children
      )
    },
  },
  {
    // Vimeo directive.
    // Data attributes are added during `bber build`
    shouldProcessNode(node) {
      return node.name === 'iframe' && node.attribs['data-vimeo']
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = attrs.src
      const aspectRatios = new Set(['16x9', '4x3'])

      let posterImage = null
      const aspectRatio = new Map([
        ['x', 16],
        ['y', 9],
      ])

      if (node.attribs['data-vimeo-poster']) {
        posterImage = Url.resolveOverlappingURL(
          requestedSpineItem.absoluteURL,
          node.attribs['data-vimeo-poster']
        )
      }

      if (
        node.attribs['data-aspect-ratio'] &&
        aspectRatios.has(node.attribs['data-aspect-ratio'])
      ) {
        const [x, y] = node.attribs['data-aspect-ratio'].split('x').map(Number)
        aspectRatio.set('x', x)
        aspectRatio.set('y', y)
      }

      delete attrs['data-vimeo']
      delete attrs['data-vimeo-poster']
      delete attrs['data-aspect-ratio']

      // Recurse back up the DOM to find if this element is a child of a spread.
      // If so, pass in `useElementOffsetLeft = false` to configure the
      // `withNodePosition` HOC. This is pretty obscure, should be handled more
      // transparently
      let nodeParent = node.parent
      while (nodeParent) {
        if (
          nodeParent.type === 'tag' &&
          nodeParent.attribs['data-marker-reference-figure']
        ) {
          attrs.useElementOffsetLeft = false
          break
        }

        nodeParent = nodeParent.parent
      }

      return React.createElement(
        Vimeo,
        { ...attrs, key, posterImage, aspectRatio },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return (
        node.name === 'image' &&
        node.attribs &&
        node.attribs['xlink:href'] &&
        Url.isRelative(node.attribs['xlink:href'])
      )
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = attrs.xlinkHref
      const xlinkHref = Url.resolveOverlappingURL(
        requestedSpineItem.absoluteURL,
        attrs.xlinkHref
      )

      return React.createElement(
        node.name,
        { ...attrs, key, xlinkHref },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return (
        node.type === 'tag' && has(node.attribs, 'data-marker-reference-figure')
      )
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = `spread-figure-${attrs['data-marker-reference-figure']}`

      return React.createElement(SpreadFigure, { ...attrs, key }, children)
    },
  },
  {
    shouldProcessNode(node) {
      return node.type === 'tag' && has(node.attribs, 'data-ultimate')
    },
    processNode(node, children) {
      return React.createElement(Ultimate, {}, children)
    },
  },
  {
    shouldProcessNode(node) {
      return node.type === 'tag' && has(node.attribs, 'data-marker-reference')
    },
    processNode(node, children) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = `spread-${attrs['data-marker-reference']}`

      return React.createElement(Spread, { ...attrs, key }, children)
    },
  },
  {
    shouldProcessNode(node) {
      return node.type === 'tag' && has(node.attribs, 'data-marker')
    },
    processNode(node, children) {
      // TODO: this should be cleaned up so that we're processing the
      // parent rather than the marker. It's necessary to remove a marker's
      // parent's margin/padding-bottom instead of calculating an offset to
      // fixes FF issue where bottom distance is *always* appended to the
      // column after resizing
      // @issue: https://github.com/triplecanopy/b-ber/issues/221

      // eslint-disable-next-line no-param-reassign
      node.parent.attribs = {
        ...node.parent.attribs,
        style: 'padding-bottom: 0; margin-bottom: 0',
      }

      const attrs = Asset.convertToReactAttrs(node.attribs)
      const key = `marker-${attrs['data-marker']}`

      return React.createElement(Marker, { ...attrs, key }, children)
    },
  },
  {
    // Anything else
    shouldProcessNode() {
      return true
    },
    processNode: processNodeDefinitions.processDefaultNode,
  },
]
