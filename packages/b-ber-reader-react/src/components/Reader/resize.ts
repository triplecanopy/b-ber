import debounce from 'lodash/debounce'
import { useCallback, useMemo } from 'react'
import Viewport from '../../helpers/Viewport'
import { ViewerSettings } from '../../models'
import type { ReaderHookDeps } from './types'

// Window/fullscreen resize handling. Extracted from the class component's
// instance methods; reads live state/props through refs and resolves
// cross-cutting calls (freeze, navigateToSpreadByIndex) through the assembled
// ReaderApi rather than `this`. The 1000ms start/end debounce that the class
// applied in its constructor is applied here (useMemo-stable so the bind/unbind
// handlers add and remove the same references).
export const useResize = ({
  stateRef,
  propsRef,
  setState,
  api,
}: ReaderHookDeps) => {
  const handleResize = useCallback((): void => {
    if (stateRef.current.disableMobileResizeEvents) return

    const viewerSettings = new ViewerSettings()
    const scrollingLayout = Viewport.isVerticallyScrolling(
      propsRef.current.readerSettings
    )

    viewerSettings.width = window.innerWidth
    // The model types height as number, but the scroll layout stores the string
    // 'auto' here (consumers branch on isNumeric); cast to preserve behavior.
    viewerSettings.height = (scrollingLayout
      ? 'auto'
      : window.innerHeight) as unknown as number

    propsRef.current.viewerSettingsActions.update(viewerSettings.get())
  }, [stateRef, propsRef])

  const runResizeStart = useCallback((): void => {
    if (stateRef.current.disableMobileResizeEvents) return

    // Capture the pre-resize position BEFORE freeze() resets
    // view.lastSpreadIndex to -1. freeze() writes userInterface to the built-in
    // store, whose synchronous notify can flush the redux lastSpreadIndex=-1
    // into props before we read it; reading first makes the ratio robust
    // regardless of that flush timing (MIGRATION-CONVENTIONS §3c). Reading -1
    // here zeroes relativeSpreadPosition and snaps the view back to the first
    // spread after every resize.
    const { spreadIndex } = stateRef.current
    const { lastSpreadIndex } = propsRef.current.view

    // Hide the UI behind the spinnner while the window is being resized and
    // dimensions recalculated
    api.current.freeze()

    // Restart the layout-stability watch. Unlike a chapter change (where
    // BookContent remounts and a fresh <Ultimate> begins watching on mount), a
    // resize keeps the same Ultimate instance mounted — the only thing that
    // re-arms its watch is view.loaded flipping true → false. Without this, the
    // spinner shown by freeze() above would never hide again (Ultimate's
    // onStable never fires), producing an infinite spinner on resize. freeze()
    // deliberately omits unload() to avoid restarting the OLD chapter's Ultimate
    // during navigation; the resize path is the case that genuinely needs it.
    propsRef.current.viewActions.unload()

    let relativeSpreadPosition = 0
    if (spreadIndex > 0 && lastSpreadIndex > 0) {
      relativeSpreadPosition = spreadIndex / lastSpreadIndex
    }

    // Save the relative position (float) to calculate next position after resize
    setState({ relativeSpreadPosition })
  }, [stateRef, propsRef, setState, api])

  const runResizeEnd = useCallback((): void => {
    if (stateRef.current.disableMobileResizeEvents) return

    // Adjust users position so that they're on/close to the page before resize
    const { relativeSpreadPosition } = stateRef.current
    const { lastSpreadIndex } = propsRef.current.view

    // Calculate approx. position
    let nextSpreadIndex = Math.round(lastSpreadIndex * relativeSpreadPosition)

    // Clamp to min/max spread indexes
    nextSpreadIndex = Math.max(0, Math.min(nextSpreadIndex, lastSpreadIndex))

    // Navigate
    api.current.navigateToSpreadByIndex(nextSpreadIndex)
  }, [stateRef, propsRef, api])

  // Debounce resize start/end (matching the original constructor config). These
  // are the references the listeners are bound to, so they must be stable.
  // TODO: 1000ms is a magic number — see IMPROVEMENT_PLAN.md H4
  const handleResizeStart = useMemo(
    () => debounce(runResizeStart, 1000, { leading: true, trailing: false }),
    [runResizeStart]
  )
  const handleResizeEnd = useMemo(
    () => debounce(runResizeEnd, 1000, { leading: false, trailing: true }),
    [runResizeEnd]
  )

  // Cancel a pending end-of-resize reposition. runResizeEnd fires on a 1000ms
  // trailing debounce and navigates to the spread the user was on when the
  // resize *started* (via the saved relativeSpreadPosition). If the user
  // manually navigates inside that window, that stale reposition would yank
  // them back — so a user navigation cancels it.
  const cancelResizeReposition = useCallback((): void => {
    handleResizeEnd.cancel()
  }, [handleResizeEnd])

  // NOTE: bindResizeHandlers / unbindResizeHandlers names are inverted in the
  // source — see IMPROVEMENT_PLAN.md H4. Behavior is preserved here as-is.
  const bindResizeHandlers = useCallback((): void => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('resize', handleResizeStart)
    window.removeEventListener('resize', handleResizeEnd)

    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      handleResize
    )
    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      handleResizeStart
    )
    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      handleResizeEnd
    )
  }, [handleResize, handleResizeStart, handleResizeEnd])

  const unbindResizeHandlers = useCallback((): void => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('resize', handleResizeStart)
    window.addEventListener('resize', handleResizeEnd)

    // docusment.addEventListener(
    //   'webkitfullscreenchange mozfullscreenchange fullscreenchange',
    //   handleResize
    // )
    document.addEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      handleResizeStart
    )
    document.addEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      handleResizeEnd
    )
  }, [handleResize, handleResizeStart, handleResizeEnd])

  return {
    handleResize,
    handleResizeStart,
    handleResizeEnd,
    cancelResizeReposition,
    bindResizeHandlers,
    unbindResizeHandlers,
  }
}
