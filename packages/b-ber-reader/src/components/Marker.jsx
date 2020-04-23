/* eslint-disable no-unused-vars */
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import { isNumeric } from '../helpers/Types'
import { debug } from '../config'
import Viewport from '../helpers/Viewport'
import withNodePosition from '../lib/with-node-position'
import * as markerActions from '../actions/markers'

class Marker extends React.Component {
  constructor(props) {
    super(props)

    const markerId = this.props['data-marker']
    if (markerId) {
      this.props.markerActions.update({
        recto: false,
        verso: false,
        elementEdgeLeft: 0,
        markerId,
        unbound: false,
      })
    }

    this.calculateOffsetHeight = this.calculateOffsetHeight.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    const markerId = this.props['data-marker']
    const { recto, verso, elementEdgeLeft } = nextProps

    if (
      markerId &&
      (recto !== this.props.recto ||
        verso !== this.props.verso ||
        elementEdgeLeft !== this.props.elementEdgeLeft)
    ) {
      this.props.markerActions.update({
        markerId,
        recto,
        verso,
        elementEdgeLeft,
      })
    }
  }

  // Get the distance between the marker and the top of the next column. Fill
  // that with padding, and add additional padding to the document to fill the
  // space that's required by the absolutely positioned spread
  calculateOffsetHeight() {
    let offsetHeight = 0

    if (
      !this.props.elemRef ||
      !this.props.elemRef.current ||
      Viewport.isMobile()
    ) {
      return offsetHeight
    }

    const { verso, recto } = this.props
    const { paddingTop, paddingBottom } = this.props.viewerSettings

    let { height } = this.props.viewerSettings
    const frameHeight = height - paddingTop - paddingBottom

    // The attributes `unbound` and `adjacent` are added by
    // DocumentProcessor.

    // `unbound` means that this is a fullbleed element with no preceeding
    // siblings. This occurs when a spread is the first element in the
    // document. The height calculations have to be adjusted in this case
    // since we don't need to worry about making up the distance between the
    // marker (which is the last element of the last preceeding element) and
    // the next column.

    // `adjacent` means that this marker shares a parent with another
    // marker. This occurs when one spread directly follows another. We have
    // to adjust our height calculations in these cases because we only want
    // to make up the distance between the bottom of the marker and the next
    // column once, and only need to account for the space required by the
    // spread after the first spread.

    const unbound = JSON.parse(this.props['data-unbound'] || 'false')
    const adjacent = JSON.parse(this.props['data-adjacent'] || 'false')

    if (!isNumeric(height)) height = 0 // frame height or window.innerHeight ...

    if (verso) {
      // Marker is on the verso, so we need to add enough space after it to
      // fill the remaining space after the marker, as well as the following
      // column. this will push our fullbleed content to the next verso

      // Make up the remaining distance only if it hasn't already been
      // accounted for in the case of adjacent markers
      if (adjacent) {
        offsetHeight += frameHeight
        offsetHeight += frameHeight
        offsetHeight -= this.props.elemRef.current.offsetHeight
      } else {
        offsetHeight += frameHeight
        offsetHeight += frameHeight
        offsetHeight -= this.props.elemRef.current.offsetHeight
        offsetHeight -= Math.round(
          this.props.elemRef.current.getBoundingClientRect().bottom - paddingTop
        )

        // Add space for the spread element itself, since it's
        // absolutely positioned. Only do this if the spread is
        // preceeded by another element, since the gap between the
        // marker and the next column is already enough space for the
        // spread
        if (!unbound) {
          offsetHeight += frameHeight
          offsetHeight += frameHeight
        }
      }
    }

    if (recto) {
      // Marker is on the recto, so we need to add enough space after it to
      // fill only the remaining column

      // Make up the remaining distance, again, only if it's not adjacent
      if (adjacent) {
        offsetHeight += frameHeight
        offsetHeight += frameHeight
        offsetHeight -= this.props.elemRef.current.offsetHeight
      } else {
        offsetHeight += frameHeight
        offsetHeight += frameHeight
        offsetHeight -= this.props.elemRef.current.offsetHeight

        // Add spread spacing
        offsetHeight += frameHeight
        offsetHeight -= Math.round(
          this.props.elemRef.current.getBoundingClientRect().top
        )
        offsetHeight += paddingTop
      }
    }

    offsetHeight = Math.floor(offsetHeight)
    if (!unbound && !adjacent) offsetHeight -= 27 // One line of text to prevent overlowing to "blank pages"
    if (adjacent) offsetHeight += 27 / 2

    const markerId = this.props['data-marker']
    const marker = this.props.markers[markerId]

    if (
      marker &&
      (recto !== marker.recto ||
        verso !== marker.verso ||
        unbound !== marker.unbound)
    ) {
      this.props.markerActions.update({
        markerId,
        recto,
        verso,
        unbound,
      })
    }

    return offsetHeight
  }

  render() {
    const { verso, recto } = this.props
    const offsetHeight = this.calculateOffsetHeight()

    const debugSpacerStyles = { background: 'coral' }
    const debugMarkerStyles = { backgroundColor: verso ? 'violet' : 'red' }

    let spacerStyles = {
      height: offsetHeight,
      display: 'block',
    }

    if (debug) spacerStyles = { ...spacerStyles, ...debugSpacerStyles }

    let markerStyles = { ...this.props.style }
    if (debug) markerStyles = { ...markerStyles, ...debugMarkerStyles }

    return (
      <span>
        <span
          data-verso={verso}
          data-recto={recto}
          style={markerStyles}
          className={this.props.className}
          ref={this.props.elemRef}
        />
        <span className="marker__spacer" style={spacerStyles} />
      </span>
    )
  }
}

export default connect(
  ({ markers }) => ({ markers }),
  dispatch => ({ markerActions: bindActionCreators(markerActions, dispatch) })
)(withNodePosition(Marker, { isMarker: true }))
