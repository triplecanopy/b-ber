import React, { useEffect, useMemo, useRef, useState } from 'react'
import { connect } from 'react-redux'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import SpreadContext from '../lib/spread-context'

// Upper bound on the per-frame re-measurement loop (see updatePosition). A spread
// converges to its final column within a few frames; this caps the loop so a
// pathological never-settling layout can't spin forever (~0.5s at 60fps).
const MAX_STABILIZE_FRAMES = 30

function Spread(props) {
  const node = useRef(null)

  // The rounded column index of this spread (quantised to multiples of 0.5 in
  // updatePosition). verso/recto and the column-spanning multiplier are derived
  // from it during render — see below.
  const [offset, setOffset] = useState(0)

  const id = useMemo(() => (Math.random() + 1).toString(36).substring(7), [])

  // Always-current ref for the values used inside updatePosition.
  //
  // Why a ref instead of reading props directly inside the effect closure?
  //
  // On a cross-breakpoint window resize (e.g. DESKTOP_LG → DESKTOP_MD):
  //   1. React renders Spread with new paddingLeft/paddingRight/columnGap.
  //      `viewerSettingsRef.current` is updated HERE, during render, before
  //      any effects run.
  //   2. React commits the DOM: Spread.height changes because paddingTop/Bottom
  //      changed → frameHeight changed.
  //   3. The OLD ResizeObserver callback fires before React has run the old
  //      effect's cleanup. If updatePosition read `props.viewerSettings` from
  //      the closure, it would see the OLD paddingLeft (stale) while
  //      `node.current.offsetLeft` already reflects the NEW layout, yielding a
  //      misclassified spread.
  //
  // Reading through `viewerSettingsRef.current` eliminates that race.
  const viewerSettingsRef = useRef(props.viewerSettings)
  viewerSettingsRef.current = props.viewerSettings

  // Re-measure the spread's column position until it stops moving.
  //
  // A spread's verso/recto classification depends on its `offsetLeft` (a
  // *position*), which changes whenever content reflows: a late image/font load,
  // or — critically — an EARLIER spread correcting its own height (verso↔recto)
  // shifts every spread after it. None of those shifts change THIS spread's own
  // box size, so a ResizeObserver alone never fires for them, and a one-shot
  // read on the settle signal can capture a value that a sibling's later
  // correction then invalidates. The result is a spread frozen at a stale
  // offset — e.g. physically at an integer (verso) column but stuck classified
  // recto, reserving an extra column and leaving a blank page.
  //
  // To converge, we re-read `offsetLeft` across animation frames, applying each
  // reading (so a multiplier/height change drives the next reflow) and stopping
  // once the position is unchanged for one frame. A ResizeObserver still kicks
  // off a fresh convergence pass on the spread's own box changes (e.g.
  // cross-breakpoint resize), and the dependency array restarts it when the
  // layout-settled signal (view.loaded / view.ultimateOffsetLeft) or padding/gap
  // change. A bounded frame budget (MAX_STABILIZE_FRAMES) prevents a
  // never-settling layout from looping forever.
  useEffect(() => {
    let rafId = null

    const readOffset = () => {
      // pageWidth is the distance one page turn translates the layout. In a
      // vertical-scroll layout viewerSettings.width is 'auto', so pageWidth is
      // NaN — bail (scroll layouts don't paginate spreads this way) rather than
      // poison `offset` with NaN. Also guards a degenerate 0 width.
      const viewerSettings = viewerSettingsRef.current
      const pageWidth = Viewport.getPageWidth(viewerSettings)
      if (!Number.isFinite(pageWidth) || pageWidth === 0) return null

      const nextLeft = node.current.offsetLeft

      // paddingLeft = (window.innerWidth - maxWidth) / 2, which is a non-integer
      // when (innerWidth - maxWidth) is odd (e.g. 1425px → paddingLeft = 172.5).
      // Chrome snaps column positions to whole pixels, so offsetLeft is often an
      // integer while paddingLeft is fractional. Valid column positions are exact
      // multiples of 0.5 × pageWidth, so rounding to the nearest 0.5 absorbs the
      // sub-pixel noise.
      const rawOffset = (nextLeft - viewerSettings.paddingLeft) / pageWidth
      return { nextLeft, offset: Math.round(rawOffset * 2) / 2 }
    }

    const stabilize = () => {
      cancelAnimationFrame(rafId)
      let frames = 0
      let prevLeft = null

      const tick = () => {
        if (!node.current) return

        const reading = readOffset()
        if (!reading) return

        // Apply every reading so a verso↔recto flip updates the spacer height
        // and triggers the reflow we then re-measure on the next frame.
        setOffset(reading.offset)

        // Unchanged since the previous frame → the position has converged.
        if (reading.nextLeft === prevLeft) return

        prevLeft = reading.nextLeft
        frames += 1
        if (frames < MAX_STABILIZE_FRAMES) {
          rafId = requestAnimationFrame(tick)
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver(stabilize)
    if (node.current) {
      resizeObserver.observe(node.current)
    }

    stabilize()

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [
    props.viewerSettings.paddingLeft,
    props.viewerSettings.paddingRight,
    props.viewerSettings.columnGap,
    // Restart convergence once the columns layout has settled (see comment above)
    props.view.loaded,
    props.view.ultimateOffsetLeft,
  ])

  // verso/recto and the column-spanning multiplier are pure functions of the
  // rounded `offset`, so derive them during render rather than storing them as
  // state updated in a layout effect (which left them a render out of phase with
  // `offset`). An integer offset = verso (2 columns); a half-integer offset =
  // recto (3 columns, to push the figure to the start of the next page).
  const verso = offset % 1 === 0
  const multiplier = verso ? 2 : 3

  const spreadContextValue = useMemo(() => {
    const isScrolling = Viewport.isVerticallyScrolling(props.readerSettings)

    let nextLeft = 0

    if (!isScrolling) {
      // Compute nextLeft from `offset` (the rounded column index) rather than
      // from raw offsetLeft. This avoids sub-pixel float errors that arise when
      // paddingLeft is fractional while offsetLeft is an integer.
      //
      // Valid column positions in the layout:
      //   column 0 (1st verso):  offset=0   → left = 0 × pageWidth
      //   column 1 (1st recto):  offset=0.5 → left = 1 × pageWidth
      //   column 2 (2nd verso):  offset=1   → left = 1 × pageWidth
      //   column 3 (2nd recto):  offset=1.5 → left = 2 × pageWidth
      // i.e. verso → Math.round(offset) × pageWidth
      //      recto → (Math.floor(offset) + 1) × pageWidth
      const pageWidth = Viewport.getPageWidth(props.viewerSettings)
      if (Number.isFinite(pageWidth)) {
        nextLeft = verso
          ? Math.round(offset) * pageWidth
          : (Math.floor(offset) + 1) * pageWidth
      }
    }

    return {
      left: nextLeft,
      layout: props.layout,
    }
  }, [offset, verso, props.viewerSettings, props.readerSettings, props.layout])

  const columnBreakStyles = useMemo(() => {
    if (browser.name !== 'safari') return {}
    return {
      WebkitColumnBreakBefore: 'always',
      WebkitColumnBreakAfter: 'always',
      WebkitColumnBreakInside: 'avoid',
    }
  }, [browser.name])

  const {
    height: windowHeight,
    paddingTop,
    paddingBottom,
  } = props.viewerSettings

  const height = (windowHeight - paddingTop - paddingBottom) * multiplier

  return (
    <div
      id={id}
      ref={node}
      style={{
        ...columnBreakStyles,
        height,
      }}
      className={`bber-spread bber-spread-${
        verso ? 'verso' : 'recto'
      } ${props.className || ''}`}
      data-marker-reference={props['data-marker-reference']}
    >
      <SpreadContext.Provider value={spreadContextValue}>
        {props.children}
      </SpreadContext.Provider>
    </div>
  )
}

export default connect(
  ({ readerSettings, viewerSettings, view }) => ({
    readerSettings,
    viewerSettings,
    view,
  }),
  () => ({})
)(Spread)
