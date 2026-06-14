import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as markerActions from '../actions/markers'
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

  let markerStyles = { ...props.style }

  const debug = false // dev

  const debugMarkerStyles = { backgroundColor: verso ? 'violet' : 'red' }

  if (debug) markerStyles = { ...markerStyles, ...debugMarkerStyles }

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

export default connect(
  ({ markers }: { markers: unknown }) => ({ markers }),
  (dispatch) => ({ markerActions: bindActionCreators(markerActions, dispatch) })
)(Marker)
