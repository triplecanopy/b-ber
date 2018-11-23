import React from 'react'
import { ProcessNodeDefinitions } from 'html-to-react'
import {
    Link,
    Footnote,
    Spread,
    Marker,
    Audio,
    Video,
    SpreadFigure,
} from '../components'
import { Asset, Url } from '../helpers'

export const isValidNode = () => true
export const processNodeDefinitions = new ProcessNodeDefinitions(React)
export const processingInstructions = ({ requestedSpineItem /*, opsURL*/ }) => [
    {
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
                node.attribs.href,
            )
            const attrs = Asset.convertToReactAttrs(node.attribs)

            return React.createElement(
                Footnote,
                {
                    ...attrs,
                    key: index,
                    href,
                },
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                node.attribs &&
                node.attribs.href &&
                Url.isRelativeURL(node.attribs.href)
            )
        },
        processNode(node, children, index) {
            const href = Url.resolveOverlappingURL(
                requestedSpineItem.absoluteURL,
                node.attribs.href,
            )
            const attrs = Asset.convertToReactAttrs(node.attribs)

            return React.createElement(
                Link,
                {
                    ...attrs,
                    key: index,
                    href,
                },
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                /^(img|source)$/.test(node.name) &&
                node.attribs &&
                node.attribs.src &&
                Url.isRelativeURL(node.attribs.src)
            )
        },
        processNode(node, children, index) {
            const attrs = Asset.convertToReactAttrs(node.attribs)

            return React.createElement(node.name, {
                ...attrs,
                key: index,
                src: Url.resolveOverlappingURL(
                    requestedSpineItem.absoluteURL,
                    node.attribs.src,
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
            const { autoPlay } = attrs

            let dataAutoPlay = false
            if (typeof autoPlay !== 'undefined') {
                dataAutoPlay = true
                delete attrs.autoPlay
            }

            return React.createElement(
                Audio,
                {
                    ...attrs,
                    'data-autoplay': dataAutoPlay,
                    key: index,
                },
                children,
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
                      node.attribs.poster,
                  )
                : null
            const { autoPlay } = attrs

            let dataAutoPlay = false
            if (typeof autoPlay !== 'undefined') {
                dataAutoPlay = true
                delete attrs.autoPlay
            }

            return React.createElement(
                Video,
                {
                    ...attrs,
                    'data-autoplay': dataAutoPlay,
                    key: index,
                    poster,
                },
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                node.name === 'image' &&
                node.attribs &&
                node.attribs['xlink:href'] &&
                Url.isRelativeURL(node.attribs['xlink:href'])
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
                        attrs.xlinkHref,
                    ),
                },
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                node.type === 'tag' &&
                {}.hasOwnProperty.call(
                    node.attribs,
                    'data-marker-reference-figure',
                )
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
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                node.type === 'tag' &&
                {}.hasOwnProperty.call(node.attribs, 'data-marker-reference')
            )
        },
        processNode(node, children, index) {
            const attrs = Asset.convertToReactAttrs(node.attribs)

            return React.createElement(
                Spread,
                {
                    ...attrs,
                    key: index,
                },
                children,
            )
        },
    },
    {
        shouldProcessNode(node) {
            return (
                node.type === 'tag' &&
                {}.hasOwnProperty.call(node.attribs, 'data-marker')
            )
        },
        processNode(node, children, index) {
            // TODO: this should be cleaned up so that we're processing the
            // parent rather than the marker. It's necessary to remove a marker's
            // parent's margin/padding-bottom instead of calculating an offset to
            // fixes FF issue where bottom distance is *always* appended to the
            // column after resizing

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
                children,
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
