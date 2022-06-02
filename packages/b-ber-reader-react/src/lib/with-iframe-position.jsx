import React from 'react'
import Viewport from '../helpers/Viewport'

const withIframePosition = (WrappedComponent, options = { enabled: false }) =>
  class WrapperComponent extends React.Component {
    iframePlaceholder = React.createRef() // Chrome

    // There's a bug in Chrome 81 that causes iframes on a different domain than
    // the host not to load in multiple column layouts. Following props are used
    // for element positioning in the work-around commened on below.
    constructor(props) {
      super(props)

      this.state = {
        iframePlaceholderTop: 0,
        iframePlaceholderWidth: 0,
        iframePlaceholderHeight: 0,
      }
    }

    UNSAFE_componentWillMount() {
      window.addEventListener('resize', this.handleResize)
    }

    componentDidMount() {
      if (!options.enabled) return
      this.updateIframePosition() // Chrome 81
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize) // Chrome 81
    }

    handleResize = () => {
      if (!options.enabled) return
      this.updateIframePosition() // Chrome 81
    }

    // Recursive call to update "floating" iframe position. The elements shift
    // around before render and can't be managed reliably in state, so poll the
    // placeholder position to check if the floating element's position matches,
    // and call again if not.
    updateIframePosition = () => {
      if (Viewport.verticallyScrolling(this.props)) {
        return
      }

      if (!this.iframePlaceholder) {
        console.warn('Could not find iframePlaceholder node')
        return
      }

      const node = this.iframePlaceholder
      const {
        iframePlaceholderTop,
        iframePlaceholderWidth,
        iframePlaceholderHeight,
      } = this.state

      const { top, width, height } = node.getBoundingClientRect()

      if (
        iframePlaceholderTop !== top ||
        iframePlaceholderWidth !== width ||
        iframePlaceholderHeight !== height
      ) {
        this.setState({
          iframePlaceholderTop: top,
          iframePlaceholderWidth: width,
          iframePlaceholderHeight: height,
        })

        setTimeout(this.updateIframePosition, 60)
      }
    }

    // @param name is the directive type, e.g., iframe, vimeo
    iframeStyleBlock = (name = 'iframe') => {
      if (!options.enabled) return ''

      return `
        .bber-context__desktop .${name}.figure__large.figure__inline .embed.supported {
          padding-top: 0 !important;
          position: static !important;
          transform: none !important;
        }

        .bber-context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported {
          position: relative !important;
        }

        .bber-context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported iframe,
        .bber-context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported .bber-iframe-placeholder + div {
          top: 0 !important;
        }
      `
    }

    render() {
      return (
        <WrappedComponent
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.props}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.state}
          iframeStyleBlock={this.iframeStyleBlock}
          innerRef={ref => (this.iframePlaceholder = ref)}
        />
      )
    }
  }

export default withIframePosition
