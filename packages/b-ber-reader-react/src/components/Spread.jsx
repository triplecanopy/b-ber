import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { connect } from 'react-redux'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import SpreadContext from '../lib/spread-context'

function Spread(props) {
  const node = useRef(null)

  const [verso, setVerso] = useState(true)
  const [left, setLeft] = useState(0)
  const [offset, setOffset] = useState(0)
  const [multiplier, setMultiplier] = useState(0)

  const id = useMemo(() => (Math.random() + 1).toString(36).substring(7), [])

  // Always-current ref for the three values used inside updatePosition.
  //
  // Why a ref instead of reading props directly inside the effect closure?
  //
  // On a cross-breakpoint window resize (e.g. DESKTOP_LG → DESKTOP_MD):
  //   1. React renders Spread with new paddingLeft/paddingRight/columnGap.
  //      `viewerSettingsRef.current` is updated HERE, during render, before
  //      any effects run.
  //   2. React commits the DOM: Spread.height changes because paddingTop/Bottom
  //      changed → frameHeight changed → (windowHeight - paddingTop - paddingBottom)
  //      * multiplier is a different number.
  //   3. The OLD ResizeObserver callback fires (Spread's height just changed)
  //      BEFORE React has had a chance to run the old effect's cleanup
  //      (disconnect + replace the observer). This is the race window.
  //   4. If updatePosition reads from `props.viewerSettings` in the closure,
  //      it sees the OLD paddingLeft (stale) while `node.current.offsetLeft`
  //      already reflects the NEW layout. The mismatch yields a non-integer
  //      `offset`, misclassifying the Spread as recto (multiplier=3 instead of
  //      2), which inflates scrollHeight and causes lastSpreadIndex=1 (two
  //      pages) and the wrong SpreadContext.left for SpreadFigure.
  //
  // Reading through `viewerSettingsRef.current` instead eliminates the race:
  // the ref was updated in step 1, so even the "stale" callback sees the
  // correct current paddingLeft. The dep array still triggers a fresh
  // effect run when these values change, covering the case where Spread's
  // height does NOT change (pure horizontal resize within a breakpoint) and
  // the ResizeObserver therefore never fires.
  const viewerSettingsRef = useRef(props.viewerSettings)
  viewerSettingsRef.current = props.viewerSettings

  useEffect(() => {
    const updatePosition = () => {
      if (!node.current) return

      const { paddingLeft, paddingRight, columnGap } = viewerSettingsRef.current
      const nextLeft = node.current.offsetLeft

      // paddingLeft = (window.innerWidth - maxWidth) / 2, which is a non-integer
      // when (innerWidth - maxWidth) is odd (e.g. 1425px → paddingLeft = 172.5).
      // Chrome's CSS columns engine snaps column positions to pixel boundaries,
      // so offsetLeft is often an integer (172 or 173) while paddingLeft is 172.5.
      // Without rounding, the raw offset would be ±0.000436 — non-zero and
      // non-integer — which misclassifies the spread as recto (multiplier=3),
      // producing a 1800px spacer and lastSpreadIndex=1 (two pages instead of one).
      //
      // Valid column positions are exact multiples of 0.5 × pageWidth (0 = first
      // verso column, 0.5 = first recto column, 1 = second verso column, …).
      // Rounding to the nearest 0.5 absorbs all sub-pixel noise.
      const pageWidth =
        window.innerWidth - paddingLeft - paddingRight + columnGap
      const rawOffset = (nextLeft - paddingLeft) / pageWidth
      const nextOffset = Math.round(rawOffset * 2) / 2

      setLeft(nextLeft)
      setOffset(nextOffset)
    }

    const resizeObserver = new ResizeObserver(updatePosition)

    if (node.current) {
      resizeObserver.observe(node.current)
    }

    updatePosition()

    return () => resizeObserver.disconnect()
  }, [
    props.viewerSettings.paddingLeft,
    props.viewerSettings.paddingRight,
    props.viewerSettings.columnGap,
  ])

  useLayoutEffect(() => {
    const nextVerso = offset === 0 || offset % 1 === 0
    const nextMultiplier = nextVerso ? 2 : 3

    setVerso(nextVerso)
    setMultiplier(nextMultiplier)
  }, [offset])

  const spreadContextValue = useMemo(() => {
    const isScrolling = Viewport.isVerticallyScrolling(props.readerSettings)

    let nextLeft = 0

    if (!isScrolling) {
      // Compute nextLeft from `offset` (the rounded column index) rather than
      // from raw offsetLeft. This avoids sub-pixel float errors that arise when
      // paddingLeft is fractional (e.g. 172.5 at 1425px) while offsetLeft is an
      // integer (172) — the raw difference would be ±0.5px, shifting the figure
      // off-screen.
      //
      // Valid column positions in the layout:
      //   column 0 (1st verso):  offset=0  → left = 0 × pageWidth = 0
      //   column 1 (1st recto):  offset=0.5 → left = 1 × pageWidth (= full page width)
      //   column 2 (2nd verso):  offset=1  → left = 1 × pageWidth
      //   column 3 (2nd recto):  offset=1.5 → left = 2 × pageWidth
      // i.e. verso → Math.round(offset) × pageWidth
      //      recto → (Math.floor(offset) + 1) × pageWidth
      const { paddingLeft, paddingRight, columnGap } = props.viewerSettings
      const pageWidth =
        window.innerWidth - paddingLeft - paddingRight + columnGap
      nextLeft = verso
        ? Math.round(offset) * pageWidth
        : (Math.floor(offset) + 1) * pageWidth
    }

    return {
      left: nextLeft,
      layout: props.layout,
    }
  }, [
    offset,
    verso,
    props.viewerSettings.paddingLeft,
    props.viewerSettings.paddingRight,
    props.viewerSettings.columnGap,
    props.layout,
  ])

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
  ({ readerSettings, viewerSettings }) => ({
    readerSettings,
    viewerSettings,
  }),
  () => ({})
)(Spread)
