import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import figure from 'bber-plugins/md/plugins/figure'
import { attributesString, attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'
import { htmlComment, src, passThrough } from 'bber-utils'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'

const markerRe = /^audio/
const directiveRe = /(audio)(?::([^\s]+)(\s+.*)?)?$/


const toAlias = fpath => path.basename(path.basename(fpath, path.extname(fpath)))

const isHostedRemotely = asset => /^http/.test(asset)

// const validatePosterImage = (_asset) => {
//   const asset = path.join(src(), '_images', _asset)
//   try {
//     if (!fs.existsSync(asset)) {
//       throw new Error('Directive [audio] poster image does not exist, aborting')
//     }
//   } catch (err) {
//     log.error(err, 1)
//   }

//   return asset
// }

const validateLocalMediaSource = (asset) => {
  const { audio } = store
  const _audio = audio.map(_ => toAlias(_))
  if (!asset.length || _audio.indexOf(asset) < 0) {
    const err = new Error(`Could not find audio file(s) matching [${asset}], make sure it's included in the [_media] directory`) // eslint-disable-line max-len
    log.error(err, 1)
  }
  return asset
}

const createLocalMediaSources = sources =>
  sources.reduce((acc, curr) => acc.concat(`
    <source src="../media/${path.basename(curr)}" type="${mime.lookup(curr)}"/>
  `), '')

const createRemoteMediaSource = sources =>
  `<source src="${sources[0]}" type="${mime.lookup(sources[0])}"/>`

export default {
  plugin: figure,
  name: 'audio',
  renderer: ({ instance, context }) => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const filename = `_markdown/${context.filename}.md`
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

      // const renderInline = instance && instance.renderInline ? instance.renderInline : passThrough

      const match = tokens[idx].info.trim().match(directiveRe)
      const [, type, id, attrs] = match
      const attrsObj = attributesObject(attrs, type, { filename, lineNr })
      const { audio } = store
      const children = tokens[idx].children
      const caption = children ? instance.renderInline(tokens[idx].children) : ''

      let sources = []
      let sourceElements = ''
      let err = null
      let poster = ''

      // if (attrsObj.poster) {
      //   poster = validatePosterImage(attrsObj.poster)
      //   poster = `../images/${path.basename(poster)}`
      //   attrsObj.poster = poster
      // }

      if (attrsObj.source) {
        const { source } = attrsObj

        if (isHostedRemotely(source)) {
          sources = [source]
          sourceElements = createRemoteMediaSource(sources)

          store.add('remoteAssets', source)

        } else if (validateLocalMediaSource(source)) {
          sources = audio.filter(_ => toAlias(_) === source)
          sourceElements = createLocalMediaSources(sources)
        }

        delete attrsObj.source // otherwise we get a `src` tag on our audio element
      } else {
        err = new Error('Directive [audio] requires a [source] attribute, aborting')
        log.error(err, 1)
      }

      if (!sources.length) {
        err = new Error(`Could not find matching audio with the basename ${source}`)
        log.error(err, 1)
      }


      const attrString = attributesString(attrsObj)
      const commentStart = htmlComment(`START: audio:${type}#${htmlId(id)};`)
      const commentEnd = htmlComment(`END: audio:${type}#${htmlId(id)};`)

      return `${commentStart}
        <audio id="${htmlId(id)}"${attrString}>
          ${sourceElements}
          <p>Your device does not support the HTML5 Audio API.</p>
        </audio>
        ${ caption ? `<p class="caption caption__audio">${caption}</p>` : '' }
        ${commentEnd}`
    },
  }),
}
