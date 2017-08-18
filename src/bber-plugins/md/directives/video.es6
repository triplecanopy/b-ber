import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import figure from 'bber-plugins/md/plugins/figure'
import { attributesString, attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'
import { htmlComment, src } from 'bber-utils'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'

const markerRe = /^video/
const directiveRe = /(video)(?::([^\s]+)(\s+.*)?)?$/


const toAlias = fpath => path.basename(path.basename(fpath, path.extname(fpath)))

const isHostedRemotely = asset => /^http/.test(asset)

const validatePosterImage = (_asset) => {
  const asset = path.join(src(), '_images', _asset)
  try {
    if (!fs.existsSync(asset)) {
      throw new Error('Directive [video] poster image does not exist, aborting')
    }
  } catch (err) {
    log.error(err, 1)
  }

  return asset
}

const validateLocalMediaSource = (asset) => {
  const { videos } = store
  const _videos = videos.map(_ => toAlias(_))
  if (!asset.length || _videos.indexOf(asset) < 0) {
    const err = new Error(`Could not find video(s) matching [${asset}], make sure it's included in the [_media] directory`) // eslint-disable-line max-len
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
  name: 'video',
  renderer: () => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const match = tokens[idx].info.trim().match(directiveRe)
      const [, type, id, attrs] = match
      const attrsObj = attributesObject(attrs, type)
      const { videos } = store

      let sources = []
      let sourceElements = ''
      let err = null
      let poster = ''

      if (attrsObj.poster) {
        poster = validatePosterImage(attrsObj.poster)
        poster = `../images/${path.basename(poster)}`
        attrsObj.poster = poster
      }

      if (attrsObj.source) {
        const { source } = attrsObj

        if (isHostedRemotely(source)) {
          sources = [source]
          sourceElements = createRemoteMediaSource(sources)

          store.add('remoteAssets', source)

        } else if (validateLocalMediaSource(source)) {
          sources = videos.filter(_ => toAlias(_) === source)
          sourceElements = createLocalMediaSources(sources)
        }

        delete attrsObj.source // otherwise we get a `src` tag on our video element
      } else {
        err = new Error('Directive [video] requires a [source] attribute, aborting')
        log.error(err, 1)
      }

      if (!sources.length) {
        err = new Error(`Could not find matching video(s) with the basename ${source}`)
        log.error(err, 1)
      }


      const attrString = attributesString(attrsObj)
      const commentStart = htmlComment(`START: video:${type}#${htmlId(id)};`)
      const commentEnd = htmlComment(`END: video:${type}#${htmlId(id)};`)

      return `${commentStart}
        <video id="${htmlId(id)}"${attrString}>
          ${sourceElements}
          <p>Your device does not support the HTML5 Video API.</p>
        </video>
        ${commentEnd}`
    },
  }),
}
