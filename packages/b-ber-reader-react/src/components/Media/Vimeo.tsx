import React from 'react'
import ReactPlayerVimeo from 'react-player/vimeo'
import {
  getPlayerPropsFromQueryString,
  getPlayingStateOnUpdate,
  getURLAndQueryParamters,
  transformSearchParamsToProps,
} from '../../helpers/media'
import { isBrowser, unlessDefined } from '../../helpers/utils'
import Viewport from '../../helpers/Viewport'
import ReaderContext from '../../lib/reader-context'
import withIframePosition from '../../lib/with-iframe-position'
import withNodePosition from '../../lib/with-node-position'
import VimeoPlayerControls from './VimeoPlayerControls'
import VimeoPosterImage from './VimeoPosterImage'

// react-player's Vimeo entry ships strict prop types that don't cover
// `playsinline` or the vimeo-specific `config.vimeo.playerOptions` shape used
// here. TODO: type these against react-player's config types.
const ReactPlayer = ReactPlayerVimeo as any

const iframePositioningEnabled = isBrowser('chrome', 'eq', 81)

interface VimeoProps {
  src: string
  posterImage?: string | null
  aspectRatio?: Map<string, number>
  // Position props injected by the HOC chain.
  iframePlaceholderTop?: number
  iframePlaceholderWidth?: number
  iframePlaceholderHeight?: number
  iframeStyleBlock: (name?: string) => string
  innerRef?: (ref: HTMLDivElement | null) => void
  elemRef?: React.Ref<HTMLDivElement>
  view?: any
  readerSettings?: any
  [key: string]: any
}

interface VimeoState {
  url: string
  loop: boolean
  muted: boolean
  controls: boolean
  playing: boolean
  autoplay: boolean
  posterImage: string | null
  playerOptions: Record<string, any>
  currentSpreadIndex: number | null
  aspectRatio: Map<string, number>
}

class Vimeo extends React.Component<VimeoProps, VimeoState> {
  static contextType = ReaderContext

  // Props that are on the vimeo player which must be managed by state
  static blacklistedProps = ['autopause' /* , 'controls' */]

  constructor(props: VimeoProps) {
    super(props)

    this.state = {
      url: '',
      loop: false, // Not sure why this needs to be duplicated on the ReactPlayer
      muted: false, // Not sure why this needs to be duplicated on the ReactPlayer
      controls: true,
      playing: false,
      autoplay: true,
      posterImage: null,
      playerOptions: {},
      currentSpreadIndex: null,
      aspectRatio: new Map([
        ['x', 16],
        ['y', 9],
      ]),
    }
  }

  UNSAFE_componentWillMount() {
    const { src, posterImage, aspectRatio } = this.props
    const [url, queryString] = getURLAndQueryParamters(src)

    const playerOptions = transformSearchParamsToProps(
      getPlayerPropsFromQueryString(queryString),
      Vimeo.blacklistedProps
    )

    // Extract autoplay property for use during page change events. Do this
    // after `transformSearchParamsToProps` to ensure boolean attrs
    const { autoplay, ...rest } = playerOptions

    // Controls is needed both in state and in playerOptions
    const { controls, muted, loop } = playerOptions

    this.setState((state) => ({
      url,
      loop: unlessDefined(loop, state.loop),
      muted: unlessDefined(muted, state.muted),
      controls: unlessDefined(controls, state.controls),
      autoplay: unlessDefined(autoplay, state.autoplay),
      // posterImage and aspectRatio come from optional props; the original JS
      // assigned them directly, preserved here.
      posterImage: posterImage as string | null,
      aspectRatio: aspectRatio as Map<string, number>,
      playerOptions: { ...rest },
    }))
  }

  UNSAFE_componentWillReceiveProps(nextProps: VimeoProps, nextContext: any) {
    const nextState = getPlayingStateOnUpdate(
      this.state,
      this.props,
      nextProps,
      nextContext
    )

    if (!nextState) return

    this.setState(nextState)
  }

  handleUpdatePlaying = () =>
    this.setState(({ playing }) => ({ playing: !playing }))

  handlePause = () => this.setState({ playing: false })

  handleEnded = () => this.setState({ playing: false })

  handleUpdatePosition = () => {}

  handleUpdateVolume = () => {}

  render() {
    const {
      url,
      loop,
      muted,
      controls,
      playing,
      posterImage,
      playerOptions,
      aspectRatio,
    } = this.state

    const {
      iframePlaceholderTop: top,
      iframePlaceholderWidth: width,
      iframePlaceholderHeight: height,
    } = this.props

    // Chrome 81
    let iframeContainerStyles: React.CSSProperties = {}
    let paddingTop: number | string | undefined

    if (iframePositioningEnabled) {
      const mobile = Viewport.isSingleColumn()
      const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop
      // The aspect-ratio Map is always seeded with `x` and `y` in state.
      const x = aspectRatio.get('x') as number
      const y = aspectRatio.get('y') as number

      // Styles for inline videos
      if (!mobile) iframeContainerStyles = { top, width, height, position }

      // Styles for fullscreen videos
      if (!mobile && (width as number) > window.innerWidth) {
        const landscape = window.innerWidth >= window.innerHeight

        iframeContainerStyles.top = '50%'
        iframeContainerStyles.left = '50%'
        iframeContainerStyles.transform = 'translateX(-50%) translateY(-50%)'

        if (landscape) {
          iframeContainerStyles.width = '100vw'
          iframeContainerStyles.height = '100vw'
          iframeContainerStyles.minWidth = `${(x / y) * 100}vh`
        } else {
          iframeContainerStyles.width = `${(y / x) * 100}vw`
          iframeContainerStyles.height = '100vw'
          iframeContainerStyles.minHeight = '100%'
        }
      }

      // .iframe-placeholder styles
      paddingTop = mobile ? 0 : `${(y / x) * 100}%`
    }

    return (
      <>
        {
          /*
            The iframePlaceholder element is a statically positioned div that
            fills the space that should be occupied by the ReactPlayer iframe.
            The iframe is absolutely positioned and is set to top and left
            positions of the placeholder. This is to address a bug in Chrome 81
            that prevents iframes from loading in multiple column layouts.

            The parent container also needs to be styled to properly render the
            layout. Inject inline styles here.
        */
          iframePositioningEnabled && (
            <style>{this.props.iframeStyleBlock('vimeo')}</style>
          )
        }

        {iframePositioningEnabled && (
          <div
            key={`placholder-${url}`}
            style={{ paddingTop }}
            className="bber-iframe-placeholder"
            ref={this.props.innerRef}
          />
        )}

        {/* Ref is used to calculate spread position in HOC */}
        <div style={iframeContainerStyles} key={url} ref={this.props.elemRef}>
          <VimeoPosterImage
            src={posterImage}
            playing={playing}
            controls={controls}
            handleUpdatePlaying={this.handleUpdatePlaying}
          />
          <ReactPlayer
            url={url}
            width="100%"
            height="100%"
            loop={loop}
            muted={muted}
            playing={playing}
            controls={controls}
            playsinline={true}
            config={{ vimeo: { playerOptions } }}
            onPause={this.handlePause}
            onEnded={this.handleEnded}
          />
          <VimeoPlayerControls
            handleUpdatePlaying={this.handleUpdatePlaying}
            handleUpdatePosition={this.handleUpdatePosition}
            handleUpdateVolume={this.handleUpdateVolume}
          />
        </div>
      </>
    )
  }
}

export default withNodePosition(
  withIframePosition(Vimeo, { enabled: iframePositioningEnabled }),
  { useParentDimensions: true }
)
