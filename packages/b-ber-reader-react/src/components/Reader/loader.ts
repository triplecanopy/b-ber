import type { ReactNode } from 'react'
import { useCallback } from 'react'
import Asset from '../../helpers/Asset'
import Request from '../../helpers/Request'
import Storage from '../../helpers/Storage'
import XMLAdaptor from '../../helpers/XMLAdaptor'
import type SpineItem from '../../models/SpineItem'
import type { ReaderHookDeps } from './types'

export const book: { content: ReactNode } = { content: null }

// OPF/NCX fetch, spine parse, and book.content population. Extracted from the
// class component's instance methods; reads live state/props through refs and
// resolves cross-cutting calls (freeze, updateQueryString, showSpineItem,
// savePosition) through the assembled ReaderApi rather than `this`.
export const useLoader = ({
  propsRef,
  stateRef,
  setState,
  api,
}: ReaderHookDeps) => {
  const createStateFromOPF = useCallback(
    async (callback?: () => void): Promise<void> => {
      const { bookURL } = propsRef.current.readerSettings

      const opfURL = XMLAdaptor.opfURL(bookURL)
      const opsURL = XMLAdaptor.opsURL(bookURL)

      // `data` is reassigned through a chain of XMLAdaptor transforms whose
      // shapes differ at each step; typed `any` to mirror the original flow.
      let data: any
      let guideItems: any
      let spineItems: any

      data = await Request.getText(opfURL)
      data = await XMLAdaptor.parseOPF(data)
      data = await XMLAdaptor.parseNCX(data, opsURL)
      ;[guideItems, spineItems] = await Promise.all([
        XMLAdaptor.createGuideItems(data),
        XMLAdaptor.createSpineItems(data),
      ])

      data = { ...guideItems, ...spineItems }
      ;[guideItems, spineItems] = await Promise.all([
        XMLAdaptor.udpateGuideItemURLs(data, opsURL),
        XMLAdaptor.udpateSpineItemURLs(data, opsURL),
      ])

      data = { ...guideItems, ...spineItems }
      data = await XMLAdaptor.createBookMetadata(data)

      setState({ opsURL, ...data }, callback)
    },
    [propsRef, setState]
  )

  // Shows content and enables UI once book content has been loaded
  const showSpineItem = useCallback((): void => {
    const { spine, spreadIndex, currentSpineItemIndex } = stateRef.current
    const { lastSpreadIndex } = propsRef.current.view

    // Guard: if spine has been lost (e.g. a setState functional update that
    // forgot to spread prev), bail out rather than crashing with a cryptic
    // TypeError. The navigation state will remain stale until the next render
    // cycle corrects it, but the reader stays alive.
    if (!spine) return console.warn('showSpineItem: spine is not in state')

    const firstChapter = currentSpineItemIndex === 0
    const lastChapter = currentSpineItemIndex === spine.length - 1
    const firstSpread = spreadIndex === 0
    const lastSpread = spreadIndex === lastSpreadIndex

    setState({ firstChapter, lastChapter, firstSpread, lastSpread }, () => {
      api.current.savePosition()
    })
  }, [stateRef, propsRef, setState, api])

  // Makes requests to load book content
  const loadSpineItem = useCallback(
    async (
      spineItem?: SpineItem,
      _deferredCallback?: () => void
    ): Promise<void> => {
      const hash = Asset.createHash(propsRef.current.readerSettings.bookURL)

      let requestedSpineItem = spineItem

      // Fall back to the first spine item when no explicit item is provided
      // (e.g. initial load with no saved position)
      if (!requestedSpineItem) [requestedSpineItem] = stateRef.current.spine

      // Guard: spine may be empty if called before createStateFromOPF has
      // completed. This should not happen in normal flow (the initialization
      // effect now shows the spinner with handleEvents:false before the OPF
      // fetch begins), but defensive checks prevent a crash if it does.
      if (!requestedSpineItem) {
        console.warn(
          'loadSpineItem: called before spine was populated — skipping'
        )
        return
      }

      api.current.freeze()

      let content

      try {
        const { cache, opsURL } = stateRef.current
        const { data, request } = await Request.getText(
          requestedSpineItem.absoluteURL
        )

        content = await XMLAdaptor.parseSpineItemResponse({
          data,
          hash,
          cache,
          opsURL,
          request,
          requestedSpineItem,
          paddingLeft: propsRef.current.viewerSettings.paddingLeft,
          columnGap: propsRef.current.viewerSettings.columnGap,
        })
      } catch (err) {
        // Something went wrong loading the book. Clear storage for this book
        // and re-enable the UI so the reader is not left in a frozen state.
        // Addresses IMPROVEMENT_PLAN.md M2.
        //
        // TODO retry? try to navigate to home?
        // @issue: https://github.com/triplecanopy/b-ber/issues/214
        console.error(err)

        const storage = Storage.get() || {}

        delete storage[hash]
        Storage.set(storage)

        // Re-enable the UI — freeze() was called before the try block and the
        // spinner would otherwise remain visible indefinitely after a failure
        propsRef.current.userInterfaceActions.update({
          handleEvents: true,
          spinnerVisible: false,
        })

        return
      }

      const { bookContent, scopedCSS } = content

      book.content = bookContent

      Asset.appendBookStyles(scopedCSS, hash)

      setState(
        {
          currentSpineItem: requestedSpineItem,
          spineItemURL: requestedSpineItem.absoluteURL,
        },
        () => {
          // Update the query string to trigger a page transition, then show
          // the spine item.
          api.current.updateQueryString(() => {
            api.current.showSpineItem()
          })
        }
      )
    },
    [propsRef, stateRef, setState, api]
  )

  return { createStateFromOPF, showSpineItem, loadSpineItem }
}
