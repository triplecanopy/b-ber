import React, { useEffect, useRef, useState } from 'react'
import { isNumeric } from '../helpers/Types'
import useDimensions from '../hooks/use-dimensions'
import { useViewActions } from '../store/viewActions'
import browser from './browser'

// Debounce window for content-dimension measurements (ms). After a DOM mutation
// or resize event fires, we wait this long for any further events before
// measuring, so that a burst of mutations (React committing a full chapter to
// the DOM in one pass) results in a single measurement.
const MEASURE_DEBOUNCE_MS = 100

// withLastSpreadIndex HOC
//
// Wraps Layout and is responsible for computing and dispatching `lastSpreadIndex`
// — the index of the last spread in the current chapter. This value is used by
// the navigation controls to know when the reader is on the final page.
//
// Previous implementation (H2 bug, see PLAN.md history):
//   A setInterval fired every 1000ms indefinitely (even between chapter loads),
//   logging to the console on every tick and polling scrollHeight regardless of
//   whether content had changed.
//
// ResizeObserver-only attempt (pass 3):
//   Replaced setInterval with ResizeObserver on #content. This introduced Bug 2:
//   in a CSS `columns` layout, #content's rendered border-box height is fixed
//   (equal to the column height). ResizeObserver tracks the border-box size —
//   it does NOT fire when new chapter content is inserted, because the rendered
//   size doesn't change. Only scrollHeight (the total linear content height)
//   changes, which ResizeObserver does not observe.
//
// Current implementation (this file — Bug 2 fix):
//   Two observers are combined:
//
//   1. MutationObserver on #content (childList + subtree): fires when React
//      commits new chapter HTML to the DOM. Used to detect chapter content
//      changes, since those are DOM mutations but not border-box size changes.
//
//   2. ResizeObserver on #content: fires when the element's rendered size
//      changes (e.g. window resize → new viewerSettings.height → new minHeight
//      on #content). Used to detect viewport changes.
//
//   Both observers trigger the same debounced measureContentDimensions() which
//   reads scrollHeight (for Chrome/Safari/most browsers) or the sentinel's
//   offsetLeft (for Firefox and Windows Edge, where the columns layout reports
//   incorrect scrollHeight values).
//
// Additional fixes applied in pass 3 (unchanged):
//   H1 — Division by zero: guarded; scroll layout always returns lastSpreadIndex=0
//   L2 — Spurious dispatch on slug change: skipped when contentDimensions===0
//   M5 — Removed console.log

const withLastSpreadIndex = (
  WrappedComponent: React.ComponentType<any>
): React.ComponentType<any> => {
  function WrapperComponent(props: any) {
    const dimensions = useDimensions(props.layout)
    // viewActions now comes from the built-in store (TASK-106); the bundle is
    // stable (useMemo on the store) so the dispatch effect can read it directly.
    const viewActions = useViewActions()
    const node = useRef<HTMLElement | null>(null)
    const [contentDimensions, setContentDimensions] = useState(0)

    // Always-current pointer to the latest measure function, so the
    // settle-driven effect below can re-measure without re-creating the
    // observers.
    const measureRef = useRef<(() => void) | null>(null)

    // Always-current ref for props so observer callbacks never close over a
    // stale copy of viewActions or getFrameHeight
    const propsRef = useRef(props)
    propsRef.current = props

    // Always-current ref for the dimensions hook result, for the same reason
    const dimensionsRef = useRef(dimensions)
    dimensionsRef.current = dimensions

    // Reset content dimensions when the chapter (slug) changes.
    // The contentDimensions effect skips its dispatch when the value is 0
    // (L2 fix), so this only serves to clear the stale reading from the
    // previous chapter. The MutationObserver will fire and re-measure once the
    // new content is committed to the DOM.
    useEffect(() => {
      setContentDimensions(0)
    }, [props.slug])

    // Set up observers that re-measure whenever content or viewport changes.
    useEffect(() => {
      // Reads the current content size and updates contentDimensions state.
      // Uses scrollHeight (the total linear content height before CSS columns
      // reflow) rather than clientHeight (the rendered border-box height, which
      // is fixed in a columns layout regardless of content volume).
      const measureContentDimensions = () => {
        if (!node.current) return

        const lastNode = document.querySelector<HTMLElement>('.bber-ultimate')

        // `browser` is the detect-browser result (a union that may lack `name`
        // on some members, or be null); read the name pragmatically.
        const browserName = (browser as { name?: string } | null)?.name

        let nextContentDimensions
        if (
          browserName === 'firefox' ||
          (browserName === 'edge' &&
            /Windows/.test(window.navigator.userAgent) &&
            lastNode)
        ) {
          // Firefox and Windows Edge report incorrect scrollHeight for CSS
          // multi-column layouts. Use the sentinel element's offsetLeft instead,
          // which represents how far to the right the content extends.
          if (!lastNode) return
          nextContentDimensions = lastNode.offsetLeft
        } else {
          // scrollHeight is the total height of content as if laid out in a
          // single column — it grows as more chapter content is added, even
          // though the rendered (border-box) height of #content stays fixed at
          // the column height.
          nextContentDimensions = Math.max(
            node.current.scrollHeight,
            node.current.offsetHeight,
            node.current.clientHeight
          )
        }

        setContentDimensions(nextContentDimensions)
      }

      // Expose the latest measure fn to the settle-driven effect below.
      measureRef.current = measureContentDimensions

      // Debounce wrapper: coalesces rapid-fire observations (e.g. React
      // committing many DOM nodes in a single chapter load) into one
      // measurement. The timer is stored in a closure variable rather than a
      // ref because it doesn't need to survive re-renders — it only lives for
      // the lifetime of this effect.
      let debounceTimer: ReturnType<typeof setTimeout> | null = null
      const debouncedMeasure = () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(
          measureContentDimensions,
          MEASURE_DEBOUNCE_MS
        )
      }

      // MutationObserver: fires when React commits new chapter HTML to the DOM.
      // In a CSS columns layout the element's rendered size does not change when
      // content is inserted, so ResizeObserver alone would miss chapter changes.
      // childList+subtree catches insertions at any depth inside #content.
      const mutationObserver = new MutationObserver(debouncedMeasure)
      if (node.current) {
        mutationObserver.observe(node.current, {
          childList: true,
          subtree: true,
        })
      }

      // ResizeObserver: fires when #content's rendered border-box changes size.
      // This happens on window resize (viewerSettings.height → minHeight changes)
      // but NOT on content insertion (see comment above). Complementary to the
      // MutationObserver.
      const resizeObserver = new ResizeObserver(debouncedMeasure)
      if (node.current) {
        resizeObserver.observe(node.current)
      }

      // Initial measurement: handles content that may already be in the DOM
      // when this effect first runs (e.g. a hot-reload, or a chapter that was
      // already parsed before mount)
      measureContentDimensions()

      return () => {
        mutationObserver.disconnect()
        resizeObserver.disconnect()
        if (debounceTimer) clearTimeout(debounceTimer)
      }
    }, [])

    // Re-measure once the layout has settled. The observers above can miss a
    // CSS columns reflow that changes scrollHeight (and, in Firefox/Edge, the
    // sentinel's offsetLeft) without changing #content's border-box size or its
    // child list. <Ultimate> signals settle via view.loaded /
    // view.ultimateOffsetLeft once offsetLeft stops moving, so re-measure then
    // to capture the final, post-reflow content size.
    useEffect(() => {
      measureRef.current?.()
    }, [props.view?.loaded, props.view?.ultimateOffsetLeft])

    // Recompute and dispatch lastSpreadIndex whenever content dimensions change
    // OR the layout settles (view.loaded / ultimateOffsetLeft). The settle
    // signal is essential for resize: a window resize changes frameHeight (and
    // re-arms <Ultimate> via freeze()→unload()), but the content's scrollHeight
    // — and therefore `contentDimensions` — often does NOT change, so keying on
    // contentDimensions alone left lastSpreadIndex stuck at freeze()'s -1 after
    // a resize, which made handlePageNavigation ignore every forward press.
    // Recomputing on settle recovers it with the new frameHeight.
    // dimensionsRef/propsRef are stable refs read at call time; the trigger set
    // is contentDimensions + the settle signal (view.loaded / ultimateOffsetLeft).
    const { loaded: viewLoaded, ultimateOffsetLeft } = props.view ?? {}
    useEffect(() => {
      // L2 fix: skip dispatch while dimensions are 0 (chapter not yet loaded or
      // just reset on slug change). freeze() already dispatches
      // lastSpreadIndex=-1 at the start of each chapter load.
      if (contentDimensions === 0) return

      const frameHeight = dimensionsRef.current.getFrameHeight()

      // H1 fix: getFrameHeight() returns 'auto' in vertical-scroll layout.
      // Division by 0 previously produced Infinity as lastSpreadIndex.
      // In scroll mode there is only one logical "spread", so use 0.
      if (!isNumeric(frameHeight) || frameHeight === 0) {
        viewActions.updateLastSpreadIndex(0)
        return
      }

      // The /2 accounts for the two-column layout: the content's linear height
      // spans two visible columns per spread (each column = frameHeight), so we
      // divide by (frameHeight * 2) to get the number of spreads.
      const pages = contentDimensions / frameHeight / 2

      // Round to the nearest 10th before ceiling to absorb floating-point slop.
      // e.g. 2.0001 → 2.0 → ceil(2.0) = 2, not 3
      const round = Math.round((pages + Number.EPSILON) * 10) / 10
      const ceil = Math.ceil(round)

      let nextLastSpreadIndex = ceil - 1

      // Never less than 0
      if (nextLastSpreadIndex < 0) nextLastSpreadIndex = 0

      viewActions.updateLastSpreadIndex(nextLastSpreadIndex)
    }, [contentDimensions, viewLoaded, ultimateOffsetLeft])

    return (
      <WrappedComponent
        innerRef={node}
        getFrameHeight={dimensions.getFrameHeight}
        getFrameWidth={dimensions.getFrameWidth}
        getSingleColumnWidth={dimensions.getSingleColumnWidth}
        updateDimensions={dimensions.updateDimensions}
        BookContent={props.BookContent}
        className={props.className}
        lastSpreadIndex={props.lastSpreadIndex}
        layout={props.layout}
        readerSettings={props.readerSettings}
        slug={props.slug}
        spreadIndex={props.spreadIndex}
        spineItemURL={props.spineItemURL}
        style={props.style}
        view={props.view}
        viewerSettings={dimensions.viewerSettings}
        userInterface={props.userInterface}
        viewerSettingsActions={dimensions.viewerSettingsActions}
      />
    )
  }

  // No connect: viewActions comes from the built-in store (TASK-106) and the
  // only state withLastSpreadIndex reads (view) arrives as a prop from Frame.
  return WrapperComponent
}

export default withLastSpreadIndex
