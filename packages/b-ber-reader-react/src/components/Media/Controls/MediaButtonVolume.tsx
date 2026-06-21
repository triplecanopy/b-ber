import classNames from 'classnames'
import React, { useState } from 'react'
import VolumeUp from '../../Icons/VolumeUp'
import MediaRangeSlider from './MediaRangeSlider'

interface MediaButtonVolumeProps {
  volume: number
  updateVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function MediaButtonVolume({ volume, updateVolume }: MediaButtonVolumeProps) {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((prev) => !prev)

  return (
    <>
      <div className={classNames('bber-slider__volume', { 'bber-open': open })}>
        <MediaRangeSlider
          duration={1} // max vol
          progress={volume} // current vol
          seek={updateVolume} // change handler
        />
      </div>
      <button
        className={classNames('bber-button bber-media__button__volume_up', {
          'bber-hover': open,
        })}
        onClick={toggle}
      >
        <VolumeUp />
      </button>
    </>
  )
}

export default MediaButtonVolume
