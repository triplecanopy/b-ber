import find from 'lodash/find'
import { MEDIA_QUERY_SCROLLING, MEDIA_QUERY_SLIDING } from '../constants'
import { MediaStyleSheet, Script } from '../models'
import { mediaScrolling, mediaSliding } from './multi-column-styles'

interface PreProcessorState {
  root: Document | null // App context, used for styles
  document: Document | null // content context, used for (removing) scripts
  styleSheets: MediaStyleSheet[]
  scripts: Script[]
  requestURI: string // Original domain of the request
}

const state: PreProcessorState = {
  root: null,
  document: null,
  styleSheets: [],
  scripts: [],
  requestURI: '',
}

class DocumentPreProcessor {
  static setContextDocument(document: Document): void {
    state.document = document
  }

  static setRootDocument(document: Document): void {
    state.root = document
  }

  static setRequestURI(requestURI: string): void {
    state.requestURI = requestURI
  }

  static createStyleSheets(): void {
    state.styleSheets = [
      ...state.styleSheets,

      new MediaStyleSheet({
        media: MEDIA_QUERY_SLIDING,
        styles: mediaSliding,
      }),

      new MediaStyleSheet({
        media: MEDIA_QUERY_SCROLLING,
        styles: mediaScrolling,
      }),
    ]
  }

  static appendStyleSheets(): void {
    state.styleSheets.forEach(
      (sheet) =>
        state.root!.querySelector(`#${sheet.id}`) === null &&
        sheet.appendSheet(state.root!)
    )
  }

  static appendScripts(): void {
    state.scripts.forEach(
      (script) =>
        /(?:text|application)\/(?:(x-)?java|ecma)script/.test(script.type) &&
        script.appendScript(state.root!)
    )
  }

  static createScriptElements(): Script[] {
    const scriptElements = Array.from(
      state.document!.querySelectorAll('script') || []
    )
    const { requestURI, scripts } = state

    if (!scriptElements) return scripts

    state.scripts = scriptElements.map(
      (node) => new Script({ node, requestURI })
    )

    return state.scripts
  }

  static removeScriptElements(): void {
    const scripts = state.document!.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      scripts[i].parentNode!.removeChild(scripts[i])
    }
  }

  static getStyleSheetByMediaOrId({
    id,
    media,
  }: {
    id?: string
    media?: string
  }): { styleSheetElement: Element; styleSheetId: string | undefined } | void {
    if (!id && !media) {
      return console.warn(
        'DocumentPreProcessor#updateStyleSheet requires either an `id` or a `media` parameter'
      )
    }

    let styleSheetId: string | undefined

    if (id) {
      styleSheetId = id
    } else if (media) {
      // The original indexes `this.styleSheets`, which is not a static field on
      // the class — preserved verbatim to keep behavior identical.
      // TODO: this likely should be `state.styleSheets`
      const _styleSheet = find((this as any).styleSheets, { media })
      if (!_styleSheet) {
        return console.warn(
          'No styleSheet exists for provided `id` or `media`',
          id,
          media
        )
      }

      styleSheetId = _styleSheet.id
    }

    const styleSheetElement = state.root!.querySelector(`#${styleSheetId}`)

    if (!styleSheetElement) {
      return console.warn(
        'No styleSheet exists for provided `id` or `media`',
        id,
        media
      )
    }

    return { styleSheetElement, styleSheetId }
  }

  static removeStyleSheet({
    id,
    media,
  }: {
    id?: string
    media?: string
  }): void {
    const { styleSheetElement } = DocumentPreProcessor.getStyleSheetByMediaOrId(
      {
        id,
        media,
      }
    ) as { styleSheetElement: Element }
    styleSheetElement.parentNode!.removeChild(styleSheetElement)
    state.styleSheets = [...state.styleSheets.filter((a) => a.id !== id)]
  }

  static removeStyleSheets(): void {
    let sheet: MediaStyleSheet | undefined
    while ((sheet = state.styleSheets.pop())) {
      DocumentPreProcessor.removeStyleSheet({ id: sheet.id })
    }
  }

  static removeScript({ id }: { id: string }): void {
    const script = state.root!.querySelector(`#${id}`)
    if (script) script.parentNode!.removeChild(script)
    state.scripts = [...state.scripts.filter((a) => a.id !== id)]
  }

  static removeScripts(): void {
    let script: Script | undefined
    while ((script = state.scripts.pop())) {
      DocumentPreProcessor.removeScript({ id: script.id })
    }
  }

  // Exchange an existing media stylesheet for a new one that targets the
  // same media
  static swapStyleSheet(/* media */): void {}

  static swapStyleSheets(): void {}

  static getStyleSheets(): MediaStyleSheet[] {
    return state.styleSheets
  }

  static getContextDocument(): Document | null {
    return state.document
  }

  static getRootDocument(): Document | null {
    return state.root
  }

  static parseXML(
    callback?: (err: null, document: Document | null) => unknown
  ): unknown {
    // TODO errors should be handled
    // @issue: https://github.com/triplecanopy/b-ber/issues/220
    const err = null

    DocumentPreProcessor.removeScriptElements()
    DocumentPreProcessor.appendStyleSheets()
    DocumentPreProcessor.appendScripts()

    if (callback && typeof callback === 'function') {
      return callback(err, state.document)
    }
    return state.document
  }
}

export default DocumentPreProcessor
