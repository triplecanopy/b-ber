
import { union } from 'lodash'
import section from 'bber-plugins/md/plugins/section'
import { log } from 'bber-plugins'
import * as directives from 'bber-shapes/directives'
import { attributes, htmlId } from 'bber-plugins/md/directives/helpers'

const containers = union(
  directives.FRONTMATTER_DIRECTIVES,
  directives.BODYMATTER_DIRECTIVES,
  directives.BACKMATTER_DIRECTIVES
).join('|')

const containerOpenRegExp = new RegExp(`(${containers})(?::(\\w+)(\\s?.*)?)?$`)
const containerCloseRegExp = /(exit)(?::(\w+))?/

// var s = '::: dir:id :classes="foo bar baz" page-break-before:yes'

export default {
  plugin: section,
  name: 'section',
  renderer: (instance, context) => ({ // eslint-disable-line no-unused-vars
    marker: directives.BLOCK_DIRECTIVE_MARKER,
    minMarkers: directives.BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,

    markerOpen: containerOpenRegExp,
    markerClose: containerCloseRegExp,

    validateOpen(params) {
      const match = params.trim().match(containerOpenRegExp) || []
      if (typeof match[1] === 'undefined') { // `match[1]` is section id
        log.error(`Missing [id] attribute for [${match[0]}] directive`)
        return false
      }
      return match
    },

    validateClose(params) {
      const match = params.trim().match(containerCloseRegExp) || []
      if (typeof match[1] === 'undefined') { // `match[1]` is section id
        log.error(`Missing [id] attribute for [${match[0]}] directive`)
        return false
      }
      return match
    },

    render(tokens, idx) {
      let result = ''


      if (tokens[idx].nesting === 1) {  // open
        const matches = tokens[idx].info.trim().match(containerOpenRegExp)
        let attrs = ''
        if (matches && matches[3]) {
          attrs = attributes(matches[3], matches[1])
        }

        result = `<section id="${htmlId(matches[2])}"${attrs}>`
      } else {                          // close
        // const close = tokens[idx].info.trim().match(containerCloseRegExp)
        result = '</section>'
      }

      return result


    //   const { escapeHtml } = instance.utils
    //   const matches = tokens[idx].info.trim().match(containerRegExp)
    //   let result = ''

    //   if (tokens[idx].nesting === 1) { // opening tag
    //     const line = tokens[idx].map ? tokens[idx].map[0] : null

    //     if (!matches) {
    //       log.error(`[${context._get('filename')}.md] <section> Malformed directive.`)
    //       result = '<section>'
    //       return result
    //     }

    //     if (matches && !matches[1]) { log.error(`[${context._get('filename')}.md:${line}] <section> Missing \`type\` attribute.`) }
    //     if (matches && !matches[2]) { log.error(`[${context._get('filename')}.md:${line}] <section> Missing \`title\` attribute.`) }

    //     let classes = [matches[1]]

    //     if (matches[3]) {
    //       classes = [
    //         ...classes,
    //         ...matches[3].split(' ').map(_ =>
    //             escapeHtml(_.trim())).filter(Boolean)
    //       ]
    //     }

    //     result = [
    //       '<section',
    //       ` epub:type="${escapeHtml(matches[1])}"`,
    //       ` title="${escapeHtml(matches[2])}"`,
    //       ` class="${classes.join(' ')}"`,
    //       '>\n'
    //     ].join('')
    //   }
    //   return result
    }
  })
}
