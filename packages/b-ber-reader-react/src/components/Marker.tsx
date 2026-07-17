import React from 'react'
import useNodePosition from '../hooks/use-node-position'

interface MarkerProps {
  style?: React.CSSProperties
  className?: string
  'data-index'?: number
  'data-final'?: boolean
}

function Marker(props: MarkerProps) {
  const { elemRef, verso, recto } = useNodePosition<HTMLSpanElement>({
    isMarker: true,
  })

  return (
    <span>
      <span
        data-verso={verso}
        data-recto={recto}
        data-index={props['data-index']}
        data-final={props['data-final']}
        className={props.className}
        ref={elemRef}
      />
      <span className="bber-marker__spacer" />
    </span>
  )
}

// Marker reads its position from useNodePosition; the former
// connect(markers, markerActions) injected props it never used (the bookmark
// feature is unwired), so the dead subscription was dropped (TASK-106).
export default Marker
