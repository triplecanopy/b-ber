import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as markerActions from '../actions/markers'
import withNodePosition from '../lib/with-node-position'

interface MarkerProps {
  verso?: boolean
  recto?: boolean
  style?: React.CSSProperties
  className?: string
  // Ref injected by the withNodePosition HOC.
  // TODO: type this once with-node-position is converted to TS
  elemRef?: any
  'data-index'?: number
  'data-final'?: boolean
}

function Marker(props: MarkerProps) {
  const { verso, recto } = props

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
        ref={props.elemRef}
      />
      <span className="bber-marker__spacer" />
    </span>
  )
}

export default connect(
  ({ markers }: { markers: unknown }) => ({ markers }),
  (dispatch) => ({ markerActions: bindActionCreators(markerActions, dispatch) })
)(withNodePosition(Marker, { isMarker: true }))
