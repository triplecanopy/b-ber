import React from 'react'
import { Layout, DebugGrid } from '.'
import Viewport from '../helpers/Viewport'
import { layouts } from '../constants'
import Messenger from '../lib/Messenger'

class Frame extends React.Component {
  node = React.createRef()

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !Viewport.isMobile() ||
      !this.node?.current ||
      nextProps.view.loaded === false ||
      this.props.view.loaded === nextProps.view.loaded
    ) {
      return
    }

    this.node.current.scrollTo(0, 0)
  }

  handleScroll = e => {
    const documentHeight = Math.max(
      this.node.current.scrollHeight,
      this.node.current.offsetHeight,
      this.node.current.clientHeight
    )

    Messenger.sendScrollEvent(e, e.target.scrollTop, documentHeight)
  }

  componentDidMount() {
    this.node.current.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    this.node.current.removeEventListener('scroll', this.handleScroll)
  }

  render() {
    const { fontSize } = this.props.viewerSettings
    const baseStyles = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
      border: 0,
      fontSize: `${fontSize}%`, // TODO standardize how fontSize is stored and loaded from viewerSettings
    }

    const desktopStyles = { overflow: 'hidden' }

    const mobileStyles = {
      WebkitOverflowScrolling: 'touch',
      overflowY: 'auto',
      overflowX: 'hidden',
    }

    const styles =
      this.props.layout === layouts.SCROLL || Viewport.isMobile()
        ? { ...baseStyles, ...mobileStyles }
        : { ...baseStyles, ...desktopStyles }

    return (
      <div
        id="frame"
        className={`_${this.props.hash}`}
        style={styles}
        ref={this.node}
      >
        <Layout {...this.props} />
        <DebugGrid {...this.props} />
      </div>
    )
  }
}

export default Frame
