import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewActions from '../actions/view'
import * as userInterfaceActions from '../actions/user-interface'

// How long to wait after the last recorded offsetLeft change before declaring
// the layout stable. The sentinel's offsetLeft is checked once per interval;
// if it hasn't changed since the previous check, layout is considered stable.
const STABILITY_CHECK_INTERVAL_MS = 100

// Ultimate — layout-stability sentinel
//
// This component is rendered at the end of each chapter's HTML content (via
// the `data-ultimate` attribute in process-nodes.js). It acts as a sentinel:
// once its `offsetLeft` stops changing (i.e., the CSS columns layout has
// finished reflowing), it signals that the chapter is ready to display.
//
// Previous implementation (C1 bug, IMPROVEMENT_PLAN.md):
//   A requestAnimationFrame loop called setState on every frame and waited for
//   100 consecutive stable readings (~1.67s minimum). This caused ~100
//   synchronous setState calls per chapter load and an arbitrary fixed delay.
//
// ResizeObserver attempt (pass 2):
//   Replaced RAF with ResizeObserver + debounce. This introduced Bug 1:
//   #frame is absolutely positioned and can resize during initial load (font
//   loading, layout passes), continuously resetting the debounce timer and
//   preventing onStable() from ever firing.
//
// Current implementation (this file — Bug 1 fix):
//   A self-rescheduling setTimeout polls offsetLeft at STABILITY_CHECK_INTERVAL_MS
//   intervals. On each tick, if offsetLeft matches the value from the previous
//   tick, layout is stable and onStable() is called. If not, the new value is
//   recorded and the check is rescheduled. This is equivalent in reliability to
//   the RAF loop but runs 6–16× less frequently (~100ms vs ~16ms between checks)
//   and does not call setState on every tick.
//
// UNSAFE_componentWillReceiveProps (restart on chapter change) is replaced by a
// useEffect that tracks the previous value of view.loaded via a ref.

function Ultimate({
  view,
  viewActions: va,
  userInterfaceActions: uia,
  children,
}) {
  const nodeRef = useRef(null)

  // Always-current refs for Redux action props so setTimeout callbacks never
  // close over a stale dispatch function
  const vaRef = useRef(va)
  vaRef.current = va
  const uiaRef = useRef(uia)
  uiaRef.current = uia

  // Whether we are currently watching for stability. Guards against onStable()
  // firing more than once per watch cycle (e.g. if startWatching is called
  // multiple times in quick succession).
  const activeRef = useRef(false)
  // The offsetLeft reading from the previous stability check. Initialised to
  // null so that the first check always results in a reschedule, giving the
  // browser at least one full STABILITY_CHECK_INTERVAL_MS to complete layout
  // before we compare values.
  const lastOffsetLeftRef = useRef(null)
  // setTimeout handle for the pending stability check
  const timerRef = useRef(null)

  // Declare layout stable: dispatch Redux actions that unhide the spinner and
  // re-enable event handling.
  const onStable = () => {
    if (!activeRef.current) return
    activeRef.current = false

    const node = nodeRef.current
    if (!node) return

    const ultimateOffsetLeft = node.offsetLeft

    vaRef.current.load()
    vaRef.current.updateUltimateNodePosition({ ultimateOffsetLeft })
    uiaRef.current.update({ handleEvents: true, spinnerVisible: false })
  }

  // Schedule a stability check after STABILITY_CHECK_INTERVAL_MS.
  // On each tick:
  //   - Read the sentinel's current offsetLeft
  //   - If unchanged since last tick → layout is stable → call onStable()
  //   - If changed → record new value, reschedule
  //
  // The self-rescheduling means it will loop until stable, handling cases where
  // CSS columns layout takes multiple frames to settle.
  const scheduleCheck = () => {
    timerRef.current = setTimeout(() => {
      if (!activeRef.current || !nodeRef.current) return

      const currentOffsetLeft = nodeRef.current.offsetLeft

      if (currentOffsetLeft === lastOffsetLeftRef.current) {
        // offsetLeft is the same as the previous tick — layout is stable
        onStable()
      } else {
        // offsetLeft changed — columns are still reflowing, try again
        lastOffsetLeftRef.current = currentOffsetLeft
        scheduleCheck()
      }
    }, STABILITY_CHECK_INTERVAL_MS)
  }

  // Begin watching for layout stability. Safe to call multiple times — the
  // previous timer is always cleared before starting a new one.
  const startWatching = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!nodeRef.current) return

    activeRef.current = true
    // Start with null so the first check always records a baseline value and
    // reschedules, giving the browser at least one full interval to complete
    // any in-progress layout before we test for stability.
    lastOffsetLeftRef.current = null

    scheduleCheck()
  }

  // Start watching on mount (initial chapter load)
  useEffect(() => {
    startWatching()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restart watching when a new chapter begins loading.
  // Replaces UNSAFE_componentWillReceiveProps which checked:
  //   if (this.props.view.loaded === true && nextProps.view.loaded === false)
  const prevLoadedRef = useRef(view.loaded)
  useEffect(() => {
    const prevLoaded = prevLoadedRef.current
    prevLoadedRef.current = view.loaded

    // view.loaded: true → false means freeze() was called (new chapter loading)
    if (prevLoaded === true && view.loaded === false) {
      startWatching()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.loaded])

  return (
    <span ref={nodeRef} className="bber-ultimate">
      {children}
    </span>
  )
}

export default connect(
  ({ view }) => ({ view }),
  dispatch => ({
    userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
    viewActions: bindActionCreators(viewActions, dispatch),
  })
)(Ultimate)
