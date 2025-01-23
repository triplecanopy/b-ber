/* eslint-disable no-unused-vars */
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import withNodePosition from '../lib/with-node-position'
import * as markerActions from '../actions/markers'

class Marker extends React.Component {
  render() {
    const { verso, recto } = this.props

    let markerStyles = { ...this.props.style }

    const debug = false // dev

    const debugMarkerStyles = { backgroundColor: verso ? 'violet' : 'red' }

    if (debug) markerStyles = { ...markerStyles, ...debugMarkerStyles }

    return (
      <span>
        <span
          data-verso={verso}
          data-recto={recto}
          data-index={this.props['data-index']}
          data-final={this.props['data-final']}
          className={this.props.className}
          ref={this.props.elemRef}
        />
        <span className="bber-marker__spacer" />
      </span>
    )
  }
}

export default connect(
  ({ markers }) => ({ markers }),
  dispatch => ({ markerActions: bindActionCreators(markerActions, dispatch) })
)(withNodePosition(Marker, { isMarker: true }))
