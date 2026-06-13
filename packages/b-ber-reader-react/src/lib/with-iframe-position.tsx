import React from 'react'
import Viewport from '../helpers/Viewport'

interface IframePositionOptions {
  enabled: boolean
}

interface IframePositionState {
  iframePlaceholderTop: number
  iframePlaceholderWidth: number
  iframePlaceholderHeight: number
}

interface IframePositionProps {
  // Read by Viewport.isVerticallyScrolling(this.props).
  layout: string
  [key: string]: unknown
}

const withIframePosition = (
  WrappedComponent: React.ComponentType<any>,
  options: IframePositionOptions = { enabled: false }
): React.ComponentType<any> =>
  class WrapperComponent extends React.Component<
    IframePositionProps,
    IframePositionState
  > {
    // Starts as a ref object, then reassigned to the resolved DOM node by the
    // `innerRef` callback below. The dual use predates the migration; typed
    // `any` to preserve it. TODO: use a single RefObject when this is reworked.
    iframePlaceholder: any = React.createRef() // Chrome

    // There's a bug in Chrome 81 that causes iframes on a different domain than
    // the host not to load in multiple column layouts. Following props are used
    // for element positioning in the work-around commened on below.
    constructor(props: any) {
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
      if (Viewport.isVerticallyScrolling(this.props)) {
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
    iframeStyleBlock = (name = 'iframe'): string => {
      if (!options.enabled) return ''

      return `
        .context__desktop .${name}.figure__large.figure__inline .embed.supported {
          padding-top: 0 !important;
          position: static !important;
          transform: none !important;
        }

        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported {
          position: relative !important;
        }

        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported iframe,
        .context__desktop .spread-with-fullbleed-media .${name}.figure__large.figure__inline .embed.supported .bber-iframe-placeholder + div {
          top: 0 !important;
        }
      `
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          iframeStyleBlock={this.iframeStyleBlock}
          innerRef={(ref: any) => {
            this.iframePlaceholder = ref
          }}
        />
      )
    }
  }

export default withIframePosition
