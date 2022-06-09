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

function AudioControlsFullStacked(props) {
  return (
    <div className="bber-media__stacked">
      <div className="bber-media__stacked__row">
        <MediaTime time={props.timeElapsed} />
        <MediaRangeSlider
          duration={props.duration}
          progress={props.progress}
          seek={props.seek}
        />
        <MediaTime time={props.timeRemaining} />
      </div>

      {/* Divider line */}
      <div className="bber-media__stacked__separator">
        <div className="bber-media__stacked__separator--line" />
      </div>

      <div className="bber-media__stacked__row">
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
}

function AudioControlsFull(props) {
  return (
    <>
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
    </>
  )
}

function AudioControls(props) {
  return Viewport.isSingleColumn() ? (
    <AudioControlsFullStacked {...props} />
  ) : (
    <AudioControlsFull {...props} />
  )
}

export default AudioControls
