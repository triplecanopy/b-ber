import findIndex from 'lodash/findIndex'
import { useCallback } from 'react'
import Url from '../../helpers/Url'
import Viewport from '../../helpers/Viewport'
import type { ReaderHookDeps } from './types'

// Page and chapter navigation. Extracted from the class component's instance
// methods; reads live state/props through refs and resolves cross-cutting calls
// (loadSpineItem, closeSidebars, sibling navigation methods) through the
// assembled ReaderApi rather than `this`.
export const useNavigation = ({
  stateRef,
  propsRef,
  setState,
  api,
}: ReaderHookDeps) => {
  const handlePageNavigation = useCallback(
    (increment: number): void => {
      // A manual page turn supersedes any pending end-of-resize reposition
      // (which would otherwise yank the reader back to the pre-resize spread).
      api.current.cancelResizeReposition()

      let { spreadIndex } = stateRef.current

      const { lastSpreadIndex } = propsRef.current.view
      const nextIndex = spreadIndex + increment

      // Chapter content hasn't been measured yet (lastSpreadIndex still at its
      // freeze() default of -1). Ignore a forward press rather than treating it
      // as "past the last spread", which would prematurely skip to the next
      // chapter (TASK-101). A backward press still falls through normally.
      if (lastSpreadIndex < 0 && nextIndex > lastSpreadIndex) {
        return
      }

      if (nextIndex > lastSpreadIndex || nextIndex < 0) {
        // Move to next or prev chapter
        const sign = Math.sign(increment)
        api.current.handleChapterNavigation(sign)
        return
      }

      const firstSpread = nextIndex === 0
      const lastSpread = nextIndex === lastSpreadIndex
      const spreadDelta = nextIndex > spreadIndex ? 1 : -1

      spreadIndex = nextIndex

      setState(
        {
          spreadIndex,
          firstSpread,
          lastSpread,
          spreadDelta,
          showSidebar: null,
        },
        () => {
          api.current.updateQueryString()
        }
      )
    },
    [stateRef, propsRef, setState, api]
  )

  const handleChapterNavigation = useCallback(
    (increment: number): void => {
      // A manual chapter change supersedes any pending end-of-resize reposition.
      api.current.cancelResizeReposition()

      let { currentSpineItemIndex } = stateRef.current

      const { spine } = stateRef.current
      const nextIndex = currentSpineItemIndex + increment
      const firstChapter = nextIndex < 0
      const lastChapter = nextIndex > spine.length - 1

      if (firstChapter || lastChapter) {
        setState({ firstChapter, lastChapter })
        return
      }

      currentSpineItemIndex = nextIndex

      const currentSpineItem = spine[nextIndex]
      const spreadIndex = 0

      setState(
        {
          spreadIndex,
          currentSpineItem,
          currentSpineItemIndex,
          showSidebar: null,
          firstChapter,
          lastChapter,
          spreadDelta: increment,
          chapterDelta: increment,
        },
        () => {
          api.current.loadSpineItem(currentSpineItem)
          api.current.savePosition()
        }
      )
    },
    [stateRef, setState, api]
  )

  const navigateToSpreadByIndex = useCallback(
    (spreadIndex: number): void => {
      setState({ spreadIndex }, () => api.current.updateQueryString())
    },
    [setState, api]
  )

  const navigateToElementById = useCallback(
    (id: string): void => {
      // Get the element to which the page will scroll in the layout
      const elem = document.querySelector<HTMLElement>(id)

      if (!elem) {
        console.warn(`Could not find element ${id}`)
        return
      }

      // Scroll to vertical position, leave a bit of room for the controls and
      // whitespace around the element
      if (Viewport.isVerticallyScrolling(propsRef.current.readerSettings)) {
        const padding = 25
        const header = document.querySelector<HTMLElement>(
          '.bber-controls__header'
        )
        const offset = (header?.offsetHeight ?? 0) + padding
        const top = elem.offsetTop - offset

        document.getElementById('frame')?.scrollTo(0, top) // TODO should be handled in Frame.jsx
      }

      const { paddingTop, paddingBottom, columnGap } =
        propsRef.current.viewerSettings

      // Calculate the frameHeight using the same method in Layout.jsx, by
      // rounding the window height minus the padding top and bottom of the
      // reader's frame
      const height = window.innerHeight
      const frameHeight = Math.round(height - paddingTop - paddingBottom)

      // Find the index of the spread that our element appears on by getting
      // it's left-most value (accounting for the gutter), and dividing it by
      // the height of a single column
      const left = elem.offsetLeft - columnGap
      const spreadIndex = Math.floor(left / frameHeight / 2)

      // Move to the desired spread when the query string actually updates
      setState({ spreadIndex }, () => api.current.updateQueryString())
    },
    [propsRef, setState, api]
  )

  const navigateToChapterByURL = useCallback(
    (absoluteURL: string): void => {
      // A manual chapter jump supersedes any pending end-of-resize reposition.
      api.current.cancelResizeReposition()

      const { spine } = stateRef.current
      const url = new window.URL(absoluteURL)

      // Can eventually handle hashes or query strings here
      const nextAbsolutURL = `${url.origin}${url.pathname}`

      const currentSpineItemIndex = findIndex(spine, {
        absoluteURL: nextAbsolutURL,
      })

      if (currentSpineItemIndex === stateRef.current.currentSpineItemIndex) {
        return api.current.closeSidebars()
      }

      if (currentSpineItemIndex < 0) {
        console.warn(`No spine item found for ${nextAbsolutURL}`)
        return
      }

      const currentSpineItem = spine[currentSpineItemIndex]
      const spreadIndex = 0

      propsRef.current.userInterfaceActions.disablePageTransitions()

      setState(
        {
          currentSpineItem,
          currentSpineItemIndex,
          spreadIndex,
        },
        () => {
          api.current.loadSpineItem(currentSpineItem)
          api.current.savePosition()
        }
      )
    },
    [stateRef, propsRef, setState, api]
  )

  const getSpineItemByAbsoluteUrl = useCallback(
    (absoluteURL: string): number => {
      const { spine } = stateRef.current
      const url = new window.URL(absoluteURL)

      // Can eventually handle hashes or query strings here
      const nextAbsolutURL = `${url.origin}${url.pathname}`
      return findIndex(spine, { absoluteURL: nextAbsolutURL })
    },
    [stateRef]
  )

  const updateQueryString = useCallback(
    (callback?: () => void): void => {
      const { spreadIndex, currentSpineItem, currentSpineItemIndex } =
        stateRef.current

      if (!currentSpineItem) return

      const { slug } = currentSpineItem
      const { searchParams } = propsRef.current.readerLocation
      const nextSearchParams = new window.URLSearchParams(searchParams)

      nextSearchParams.set(
        Url.queryStringKey(
          propsRef.current.readerSettings.searchParamKeys.slug
        ),
        Url.queryStringValue(slug)
      )
      nextSearchParams.set(
        Url.queryStringKey(
          propsRef.current.readerSettings.searchParamKeys.currentSpineItemIndex
        ),
        Url.queryStringValue(currentSpineItemIndex)
      )
      nextSearchParams.set(
        Url.queryStringKey(
          propsRef.current.readerSettings.searchParamKeys.spreadIndex
        ),
        Url.queryStringValue(spreadIndex)
      )

      const nextLocation = { searchParams: nextSearchParams.toString() }

      propsRef.current.readerLocationActions.updateLocation(nextLocation)

      if (callback) callback()
    },
    [stateRef, propsRef]
  )

  const savePosition = useCallback((): void => {
    const { currentSpineItemIndex, spreadIndex } = stateRef.current
    const { searchParamKeys } = propsRef.current.readerSettings

    const params = new URLSearchParams()

    // URLSearchParams.set coerces to string at runtime; coerce explicitly to
    // satisfy the typed (string, string) signature without changing behavior.
    params.set(
      searchParamKeys.currentSpineItemIndex,
      String(currentSpineItemIndex)
    )
    params.set(searchParamKeys.spreadIndex, String(spreadIndex))

    const location = { searchParams: params.toString() }

    propsRef.current.readerLocationActions.updateLocalStorage(location)
  }, [stateRef, propsRef])

  return {
    handlePageNavigation,
    handleChapterNavigation,
    navigateToSpreadByIndex,
    navigateToElementById,
    navigateToChapterByURL,
    getSpineItemByAbsoluteUrl,
    updateQueryString,
    savePosition,
  }
}
