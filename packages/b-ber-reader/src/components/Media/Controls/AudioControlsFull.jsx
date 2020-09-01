import React from 'react'
import MediaButtonLoop from './MediaButtonLoop'
import MediaButtonPlaybackRate from './MediaButtonPlaybackRate'
import { MediaButtonSeekBack, MediaButtonSeekForward } from './MediaButtonSeek'
import MediaButtonPlayPause from './MediaButtonPlayPause'
import MediaTime from './MediaTime'
import MediaRangeSlider from './MediaRangeSlider'
import MediaButtonDownload from './MediaButtonDownload'
import MediaButtonVolume from './MediaButtonVolume'
import Viewport from '../../../helpers/Viewport'

const AudioControlsFullStacked = props => (
  <div className="media__stacked">
    <div className="media__stacked__row">
      <MediaTime time={props.timeElapsed} />
      <MediaRangeSlider
        duration={props.duration}
        progress={props.progress}
        seek={props.seek}
      />
      <MediaTime time={props.timeRemaining} />
    </div>

    {/* Divider line */}
    <div className="media__stacked__separator">
      <div className="media__stacked__separator--line" />
    </div>

    <div className="media__stacked__row">
      <MediaButtonSeekBack timeBack={props.timeBack} />
      <MediaButtonPlayPause
        paused={props.paused}
        pause={props.pause}
        play={props.play}
      />
      <MediaButtonSeekForward timeForward={props.timeForward} />

      <MediaButtonLoop loop={props.loop} updateLoop={props.updateLoop} />

      <MediaButtonPlaybackRate
        playbackRate={props.playbackRate}
        playbackSlow={props.playbackSlow}
        playbackNormal={props.playbackNormal}
        playbackFast={props.playbackFast}
      />

      {/* Spacer */}
      <div style={{ marginRight: 'auto' }} />

      <MediaButtonVolume
        volume={props.volume}
        updateVolume={props.updateVolume}
      />

      <MediaButtonDownload currentSrc={props.currentSrc} />
    </div>
  </div>
)

const AudioControlsFull = props => (
  <React.Fragment>
    <MediaButtonSeekBack timeBack={props.timeBack} />
    <MediaButtonPlayPause
      paused={props.paused}
      pause={props.pause}
      play={props.play}
    />
    <MediaButtonSeekForward timeForward={props.timeForward} />

    <MediaButtonLoop loop={props.loop} updateLoop={props.updateLoop} />

    <MediaButtonPlaybackRate
      playbackRate={props.playbackRate}
      playbackSlow={props.playbackSlow}
      playbackNormal={props.playbackNormal}
      playbackFast={props.playbackFast}
    />

    <MediaTime time={props.timeElapsed} />
    <MediaRangeSlider
      duration={props.duration}
      progress={props.progress}
      seek={props.seek}
    />
    <MediaTime time={props.timeRemaining} />

    <MediaButtonVolume
      volume={props.volume}
      updateVolume={props.updateVolume}
    />

    <MediaButtonDownload currentSrc={props.currentSrc} />
  </React.Fragment>
)

const AudioControls = props =>
  Viewport.isMobile() ? (
    <AudioControlsFullStacked {...props} />
  ) : (
    <AudioControlsFull {...props} />
  )

export default AudioControls
