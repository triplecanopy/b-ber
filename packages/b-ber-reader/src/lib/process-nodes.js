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
} from '../components'
import { Asset, Url } from '../helpers'

export const isValidNode = () => true
export const processNodeDefinitions = new ProcessNodeDefinitions(React)
export const processingInstructions = ({ requestedSpineItem /*, opsURL*/ }) => [
  {
    replaceChildren: true,

    shouldProcessNode(node) {
      return (
        node.attribs &&
        node.attribs['epub:type'] &&
        node.attribs['epub:type'] === 'noteref'
      )
    },
    processNode(node, children, index) {
      const href = Url.resolveOverlappingURL(
        requestedSpineItem.absoluteURL,
        node.attribs.href
      )
      const attrs = Asset.convertToReactAttrs(node.attribs)

      return React.createElement(
        Footnote,
        {
          ...attrs,
          key: index,
          href,
        },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return node.attribs && node.attribs.href
    },
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)

      let { href } = node.attribs
      if (Url.isRelative(node.attribs.href)) {
        href = Url.resolveOverlappingURL(
          requestedSpineItem.absoluteURL,
          node.attribs.href
        )
      }

      return React.createElement(
        Link,
        {
          ...attrs,
          key: index,
          href,
        },
        children
      )
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
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)

      return React.createElement(node.name, {
        ...attrs,
        key: index,
        src: Url.resolveOverlappingURL(
          requestedSpineItem.absoluteURL,
          node.attribs.src
        ),
      })
    },
  },
  {
    shouldProcessNode(node) {
      return node.name === 'audio'
    },
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const { autoPlay, controls } = attrs

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
          key: index,
        },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return node.name === 'video'
    },
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      const poster = node.attribs.poster
        ? Url.resolveOverlappingURL(
            requestedSpineItem.absoluteURL,
            node.attribs.poster
          )
        : null
      const { autoPlay, controls } = attrs

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
          key: index,
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
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      let posterImage = null

      if (node.attribs['data-vimeo-poster']) {
        posterImage = Url.resolveOverlappingURL(
          requestedSpineItem.absoluteURL,
          node.attribs['data-vimeo-poster']
        )
      }

      delete attrs['data-vimeo']
      delete attrs['data-vimeo-poster']

      // Recurse back up the DOM to find if this element is a child of a spread.
      // If so, pass in `useAdjustedColumnWidth = false` to configure the
      // `withNodePosition` HOC. This is pretty obscure, should be handled more
      // transparently
      let nodeParent = node.parent
      while (nodeParent) {
        if (
          nodeParent.type === 'tag' &&
          nodeParent.attribs['data-marker-reference-figure']
        ) {
          attrs.useAdjustedColumnWidth = false
          break
        }

        nodeParent = nodeParent.parent
      }

      return React.createElement(
        Vimeo,
        { ...attrs, key: index, posterImage },
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
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)

      return React.createElement(
        node.name,
        {
          ...attrs,
          key: index,
          xlinkHref: Url.resolveOverlappingURL(
            requestedSpineItem.absoluteURL,
            attrs.xlinkHref
          ),
        },
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
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)
      return React.createElement(
        SpreadFigure,
        {
          ...attrs,
          key: index,
        },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return node.type === 'tag' && has(node.attribs, 'data-marker-reference')
    },
    processNode(node, children, index) {
      const attrs = Asset.convertToReactAttrs(node.attribs)

      return React.createElement(
        Spread,
        {
          ...attrs,
          key: index,
        },
        children
      )
    },
  },
  {
    shouldProcessNode(node) {
      return node.type === 'tag' && has(node.attribs, 'data-marker')
    },
    processNode(node, children, index) {
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

      return React.createElement(
        Marker,
        {
          ...attrs,
          key: index,
        },
        children
      )
    },
  },
  {
    // Anything else
    shouldProcessNode(/*node*/) {
      return true
    },
    processNode: processNodeDefinitions.processDefaultNode,
  },
]
