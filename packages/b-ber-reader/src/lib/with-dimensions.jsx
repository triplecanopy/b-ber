import React from 'react'
import Viewport from '../helpers/Viewport'
import { isNumeric } from '../helpers/Types'
import { layouts } from '../constants'

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

    updateDimensions() {
      const scrollingLayout =
        this.props.layout === layouts.SCROLL || Viewport.isMobile()

      const width = window.innerWidth
      const height = scrollingLayout ? 'auto' : window.innerHeight
      const columns = scrollingLayout ? 1 : 2

      this.props.update({ width, height, columns })
    }

    getFrameHeight() {
      if (this.props.layout === layouts.SCROLL || Viewport.isMobile()) {
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

  return WrapperComponent
}

export default withDimensions
