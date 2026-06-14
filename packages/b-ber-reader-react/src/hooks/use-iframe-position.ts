import { useCallback, useEffect, useRef, useState } from 'react'
import Viewport from '../helpers/Viewport'

interface UseIframePositionOptions {
  // Chrome 81 work-around toggle. When false the hook is inert (the resize
  // listener is still attached but no-ops), matching the HOC's `options.enabled`.
  enabled?: boolean
  // Read by Viewport.isVerticallyScrolling; the HOC read it from this.props.layout
  // (in practice undefined for these consumers, so the check falls back to
  // isSingleColumn()). Threaded through to preserve that.
  layout?: string
}

interface UseIframePositionResult {
  iframePlaceholderTop: number
  iframePlaceholderWidth: number
  iframePlaceholderHeight: number
  iframeStyleBlock: (name?: string) => string
  innerRef: (ref: HTMLElement | null) => void
}

interface PlaceholderRect {
  top: number
  width: number
  height: number
}

// Replaces with-iframe-position. There's a bug in Chrome 81 that prevents
// iframes on a different domain than the host from loading in multiple-column
// layouts. The work-around positions the iframe absolutely over a statically
// positioned placeholder; this hook measures that placeholder and exposes the
// resulting geometry plus the style block and placeholder ref the consumer
// renders.
const useIframePosition = ({
  enabled = false,
  layout,
}: UseIframePositionOptions = {}): UseIframePositionResult => {
  const [placeholder, setPlaceholder] = useState<PlaceholderRect>({
    top: 0,
    width: 0,
    height: 0,
  })

  // The placeholder DOM node, set via the `innerRef` callback below.
  const placeholderRef = useRef<HTMLElement | null>(null)

  // updateIframePosition polls via setTimeout and so must read the current
  // measurement without re-closing over it each render.
  const placeholderStateRef = useRef(placeholder)
  placeholderStateRef.current = placeholder

  // Pending poll timeout, cleared on unmount so a late tick can't setState after
  // the component is gone (§3d).
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const innerRef = useCallback((ref: HTMLElement | null) => {
    placeholderRef.current = ref
  }, [])

  // Recursive call to update the "floating" iframe position. The elements shift
  // around before render and can't be managed reliably in state, so poll the
  // placeholder position to check if the floating element's position matches,
  // and call again if not.
  const updateIframePosition = useCallback(() => {
    if (Viewport.isVerticallyScrolling({ layout: layout as string })) return

    const node = placeholderRef.current
    if (!node) {
      console.warn('Could not find iframePlaceholder node')
      return
    }

    const { top, width, height } = node.getBoundingClientRect()
    const current = placeholderStateRef.current

    if (
      current.top !== top ||
      current.width !== width ||
      current.height !== height
    ) {
      setPlaceholder({ top, width, height })
      timeoutRef.current = setTimeout(updateIframePosition, 60)
    }
  }, [layout])

  useEffect(() => {
    const handleResize = () => {
      if (!enabled) return
      updateIframePosition() // Chrome 81
    }

    window.addEventListener('resize', handleResize)

    if (enabled) updateIframePosition() // Chrome 81

    return () => {
      window.removeEventListener('resize', handleResize) // Chrome 81
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [enabled, updateIframePosition])

  // @param name is the directive type, e.g., iframe, vimeo
  const iframeStyleBlock = useCallback(
    (name = 'iframe'): string => {
      if (!enabled) return ''

      return `
        .context__desktop .${name}.figure__large.figure__inline .embed.supported {
          padding-top: 0 !important;
          position: static !important;
          transform: none !important;
        }

        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported {
          position: relative !important;
        }

        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported iframe,
        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported .bber-iframe-placeholder + div {
          top: 0 !important;
        }
      `
    },
    [enabled]
  )

  return {
    iframePlaceholderTop: placeholder.top,
    iframePlaceholderWidth: placeholder.width,
    iframePlaceholderHeight: placeholder.height,
    iframeStyleBlock,
    innerRef,
  }
}

export default useIframePosition
