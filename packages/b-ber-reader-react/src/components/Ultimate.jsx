import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as userInterfaceActions from '../actions/user-interface'
import * as viewActions from '../actions/view'

// How long to wait after the last recorded offsetLeft change before declaring
// the layout stable. The sentinel's offsetLeft is checked once per interval;
// if it hasn't changed since the previous check, layout is considered stable.
const STABILITY_CHECK_INTERVAL_MS = 100

// Maximum time (ms) to wait for layout stability before forcing onStable().
// Guards against infinite loops when offsetLeft keeps changing (e.g. slow
// font loads, animated CSS, or external layout interference).
const MAX_WAIT_MS = 1500

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
  // Timestamp (Date.now()) recorded when startWatching() begins. Used to
  // enforce MAX_WAIT_MS: if layout has not stabilised within that window,
  // onStable() is called unconditionally so the spinner always hides.
  const startTimeRef = useRef(0)

  // Declare layout stable: dispatch Redux actions that unhide the spinner and
  // re-enable event handling.
  //
  // NOTE: always dispatch regardless of whether nodeRef.current is available.
  // If the node is absent (e.g. the sentinel unmounted between startWatching
  // and onStable firing), we still must hide the spinner — using 0 as a
  // fallback for ultimateOffsetLeft. Failing silently here leaves the UI
  // permanently locked.
  const onStable = () => {
    if (!activeRef.current) return
    activeRef.current = false

    const node = nodeRef.current
    const ultimateOffsetLeft = node ? node.offsetLeft : 0

    vaRef.current.load()
    vaRef.current.updateUltimateNodePosition({ ultimateOffsetLeft })
    uiaRef.current.update({ handleEvents: true, spinnerVisible: false })
  }

  // Schedule a stability check after STABILITY_CHECK_INTERVAL_MS.
  // On each tick:
  //   - If MAX_WAIT_MS has elapsed → force onStable() regardless
  //   - If the sentinel node is absent → reschedule (it may appear shortly)
  //   - If offsetLeft is unchanged since last tick → layout is stable → call onStable()
  //   - Otherwise → record new value, reschedule
  //
  // The self-rescheduling means it will loop until stable, handling cases where
  // CSS columns layout takes multiple frames to settle. MAX_WAIT_MS ensures
  // onStable() always fires even when layout never settles (e.g. slow fonts,
  // animated CSS, or any external factor that keeps offsetLeft changing).
  //
  // Critically: we never silently exit without calling onStable() — doing so
  // would leave the spinner permanently locked. If the node is absent we keep
  // rescheduling; if MAX_WAIT_MS elapses we force-dispatch regardless.
  const scheduleCheck = () => {
    timerRef.current = setTimeout(() => {
      if (!activeRef.current) return

      const elapsed = Date.now() - startTimeRef.current

      // Force resolution after MAX_WAIT_MS regardless of layout state
      if (elapsed >= MAX_WAIT_MS) {
        onStable()
        return
      }

      const node = nodeRef.current

      // Node not yet in DOM (or momentarily absent during a remount) — keep
      // waiting. MAX_WAIT_MS above ensures we don't loop forever.
      if (!node) {
        scheduleCheck()
        return
      }

      const currentOffsetLeft = node.offsetLeft

      if (currentOffsetLeft === lastOffsetLeftRef.current) {
        // offsetLeft is stable — declare stable
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
  //
  // We do NOT gate on nodeRef.current here: if the sentinel happens to be
  // absent at the moment startWatching is called (e.g. a rapid unmount/remount
  // during StrictMode or a chapter transition), scheduleCheck will keep
  // rescheduling until the node appears or MAX_WAIT_MS forces resolution.
  const startWatching = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    activeRef.current = true
    // Start with null so the first check always records a baseline value and
    // reschedules, giving the browser at least one full interval to complete
    // any in-progress layout before we test for stability.
    lastOffsetLeftRef.current = null
    startTimeRef.current = Date.now()

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
  (dispatch) => ({
    userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
    viewActions: bindActionCreators(viewActions, dispatch),
  })
)(Ultimate)
