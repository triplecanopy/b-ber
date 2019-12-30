import React from 'react'
import Viewport from '../helpers/Viewport'
import { isNumeric } from '../helpers/Types'

function withDimensions(WrappedComponent) {
  return class extends React.Component {
    state = {
      width: 0,
      height: 0,
      columns: 2,
      columnGap: 0,
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
    }

    constructor(props) {
      super(props)

      this.getFrameWidth = this.getFrameWidth.bind(this)
      this.getFrameHeight = this.getFrameHeight.bind(this)
      this.getSingleColumnWidth = this.getSingleColumnWidth.bind(this)
      this.updateDimensions = this.updateDimensions.bind(this)
    }

    componentWillMount() {
      const {
        width,
        height,
        columnGap,
        paddingTop,
        paddingLeft,
        paddingRight,
        paddingBottom,
      } = this.props.viewerSettings

      this.setState(
        {
          width,
          height,
          columnGap,
          paddingTop,
          paddingLeft,
          paddingRight,
          paddingBottom,
        },
        () => this.updateDimensions()
      )
    }

    updateDimensions() {
      const isMobile = Viewport.isMobile()

      const width = window.innerWidth
      const height = isMobile ? 'auto' : window.innerHeight
      const columns = isMobile ? 1 : 2

      this.setState({
        width,
        height,
        columns,
      })
    }

    getFrameHeight() {
      if (Viewport.isMobile()) return 'auto'

      let { height } = this.state
      const { paddingTop, paddingBottom } = this.state

      // make sure we're not treating 'auto' as a number
      if (!isNumeric(height)) height = window.innerHeight

      height -= paddingTop
      height -= paddingBottom

      return height
    }

    getFrameWidth() {
      const { width, paddingLeft, paddingRight, columnGap } = this.state
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
          {...this.state}
          {...this.props}
        />
      )
    }
  }
}

export default withDimensions
