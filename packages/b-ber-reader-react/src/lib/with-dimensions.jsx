/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Viewport from '../helpers/Viewport'
import { isNumeric } from '../helpers/Types'
import * as viewerSettingsActions from '../actions/viewer-settings'

const withDimensions = WrappedComponent => {
  class WrapperComponent extends React.Component {
    constructor(props) {
      super(props)

      this.getFrameWidth = this.getFrameWidth.bind(this)
      this.getFrameHeight = this.getFrameHeight.bind(this)
      this.getSingleColumnWidth = this.getSingleColumnWidth.bind(this)
      this.updateDimensions = this.updateDimensions.bind(this)
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
      this.updateDimensions()
    }

    getWidth = scrollingLayout => {
      // Column layout, return the window width
      if (!scrollingLayout) return window.innerWidth

      // Scrolling layout, but not a mobile device, return the window width
      if (/mobi/i.test(window.navigator.userAgent) === false) {
        return window.innerWidth
      }

      // Get the device orientation and return either the screen height or width
      const { matches: landscapeOrientation } = window.matchMedia(
        '(orientation: landscape)'
      )

      return landscapeOrientation ? window.screen.height : window.screen.width
    }

    updateDimensions() {
      const scrollingLayout = Viewport.verticallyScrolling(this.props)
      const width = this.getWidth(scrollingLayout)
      const height = scrollingLayout ? 'auto' : window.innerHeight
      const columns = scrollingLayout ? 1 : 2

      this.props.viewerSettingsActions.update({ width, height, columns })
    }

    getFrameHeight() {
      if (Viewport.verticallyScrolling(this.props)) {
        return 'auto'
      }

      let { height } = this.props.viewerSettings
      const { paddingTop, paddingBottom } = this.props.viewerSettings

      // make sure we're not treating 'auto' as a number
      if (!isNumeric(height)) height = window.innerHeight

      height -= paddingTop
      height -= paddingBottom

      return height
    }

    getFrameWidth() {
      const {
        width,
        paddingLeft,
        paddingRight,
        columnGap,
      } = this.props.viewerSettings

      return width - paddingLeft - paddingRight - columnGap
    }

    getSingleColumnWidth() {
      return this.getFrameWidth() / 2
    }

    render() {
      return (
        <WrappedComponent
          getFrameHeight={this.getFrameHeight}
          getFrameWidth={this.getFrameWidth}
          getSingleColumnWidth={this.getSingleColumnWidth}
          updateDimensions={this.updateDimensions}
          {...this.props}
        />
      )
    }
  }

  // return WrapperComponent
  return connect(
    ({ viewerSettings }) => ({ viewerSettings }),
    dispatch => ({
      viewerSettingsActions: bindActionCreators(
        viewerSettingsActions,
        dispatch
      ),
    })
  )(WrapperComponent)
}

export default withDimensions
