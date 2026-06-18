import React, { useContext, useState } from 'react'
import ReactPlayerVimeo from 'react-player/vimeo'
import {
  getPlayerPropsFromQueryString,
  getPlayingStateOnUpdate,
  getURLAndQueryParamters,
  transformSearchParamsToProps,
} from '../../helpers/media'
import { unlessDefined } from '../../helpers/utils'
import useNodePosition from '../../hooks/use-node-position'
import ReaderContext from '../../lib/reader-context'
import VimeoPlayerControls from './VimeoPlayerControls'
import VimeoPosterImage from './VimeoPosterImage'

// react-player's Vimeo entry ships strict prop types that don't cover
// `playsinline` or the vimeo-specific `config.vimeo.playerOptions` shape used
// here. TODO: type these against react-player's config types.
const ReactPlayer = ReactPlayerVimeo as any

// Props that are on the vimeo player which must be managed by state
const blacklistedProps = ['autopause' /* , 'controls' */]

interface VimeoProps {
  src: string
  posterImage?: string | null
  aspectRatio?: Map<string, number>
  // Per-instance override for the node-position calc (set by process-nodes for
  // spread-nested embeds); forwarded to useNodePosition.
  useElementOffsetLeft?: boolean
  layout?: string
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

function Vimeo(props: VimeoProps) {
  const context = useContext(ReaderContext)

  const node = useNodePosition<HTMLDivElement>({
    useParentDimensions: true,
    useElementOffsetLeft: props.useElementOffsetLeft,
  })

  // UNSAFE_componentWillMount derived initial state from props synchronously
  // before the first render. Reproduce that ordering in a useState initializer
  // (which runs before first paint) rather than an effect, which would run
  // after it and flash a blank player.
  const [state, setState] = useState<VimeoState>(() => {
    const { src, posterImage, aspectRatio } = props
    const [url, queryString] = getURLAndQueryParamters(src)

    const playerOptions = transformSearchParamsToProps(
      getPlayerPropsFromQueryString(queryString),
      blacklistedProps
    )

    // Extract autoplay property for use during page change events. Do this
    // after `transformSearchParamsToProps` to ensure boolean attrs
    const { autoplay, ...rest } = playerOptions

    // Controls is needed both in state and in playerOptions
    const { controls, muted, loop } = playerOptions

    return {
      url,
      loop: unlessDefined(loop, false),
      muted: unlessDefined(muted, false),
      controls: unlessDefined(controls, true),
      playing: false,
      autoplay: unlessDefined(autoplay, true),
      // posterImage and aspectRatio come from optional props; the original JS
      // assigned them directly, preserved here.
      posterImage: posterImage as string | null,
      playerOptions: { ...rest },
      currentSpreadIndex: null,
      aspectRatio: aspectRatio as Map<string, number>,
    }
  })

  // UNSAFE_componentWillReceiveProps recomputed play/pause from the incoming
  // props/context *before* committing, never on mount and never on an internal
  // setState (e.g. the poster-click toggle). Reproduce that with a render-phase
  // update (React's endorsed "adjust state while rendering" pattern), which
  // applies synchronously like the old lifecycle — an effect would defer it a
  // frame and flash the wrong play state. Trigger only when the inputs
  // getPlayingStateOnUpdate keys on change: spread navigation or load
  // completion.
  const [prevInputs, setPrevInputs] = useState({
    spreadIndex: context?.spreadIndex,
    viewLoaded: node.view?.loaded,
  })

  if (
    context?.spreadIndex !== prevInputs.spreadIndex ||
    node.view?.loaded !== prevInputs.viewLoaded
  ) {
    setPrevInputs({
      spreadIndex: context?.spreadIndex,
      viewLoaded: node.view?.loaded,
    })

    // getPlayingStateOnUpdate reads view.loaded/readerSettings (props arg) and
    // the element's spreadIndex (nextProps arg) — values the withNodePosition
    // HOC used to inject, now sourced from useNodePosition.
    const nodeProps = {
      view: node.view,
      readerSettings: node.readerSettings,
      spreadIndex: node.spreadIndex,
    }

    const nextState = getPlayingStateOnUpdate(
      state,
      nodeProps,
      nodeProps,
      context
    )
    if (nextState) setState((prev) => ({ ...prev, ...nextState }))
  }

  const handleUpdatePlaying = () =>
    setState((prev) => ({ ...prev, playing: !prev.playing }))

  const handlePause = () => setState((prev) => ({ ...prev, playing: false }))

  const handleEnded = () => setState((prev) => ({ ...prev, playing: false }))

  const handleUpdatePosition = () => {}

  const handleUpdateVolume = () => {}

  const { url, loop, muted, controls, playing, posterImage, playerOptions } =
    state

  return (
    // Ref is used to calculate spread position in useNodePosition
    <div key={url} ref={node.elemRef}>
      <VimeoPosterImage
        src={posterImage}
        playing={playing}
        controls={controls}
        handleUpdatePlaying={handleUpdatePlaying}
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
        onPause={handlePause}
        onEnded={handleEnded}
      />
      <VimeoPlayerControls
        handleUpdatePlaying={handleUpdatePlaying}
        handleUpdatePosition={handleUpdatePosition}
        handleUpdateVolume={handleUpdateVolume}
      />
    </div>
  )
}

export default Vimeo
