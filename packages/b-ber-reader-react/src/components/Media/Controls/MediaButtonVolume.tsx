import classNames from 'classnames'
import React from 'react'
import MediaRangeSlider from './MediaRangeSlider'

interface MediaButtonVolumeProps {
  volume: number
  updateVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface MediaButtonVolumeState {
  open: boolean
}

class MediaButtonVolume extends React.Component<
  MediaButtonVolumeProps,
  MediaButtonVolumeState
> {
  constructor(props: MediaButtonVolumeProps) {
    super(props)

    this.state = { open: false }
  }

  toggle = () => this.setState((state) => ({ open: !state.open }))

  render() {
    const { open } = this.state

    return (
      <>
        <div
          className={classNames('bber-slider__volume', { 'bber-open': open })}
        >
          <MediaRangeSlider
            duration={1} // max vol
            progress={this.props.volume} // current vol
            seek={this.props.updateVolume} // change handler
          />
        </div>
        <button
          className={classNames(
            'bber-button material-icons bber-media__button__volume_up',
            { 'bber-hover': open }
          )}
          onClick={this.toggle}
        >
          volume_up
        </button>
      </>
    )
  }
}

export default MediaButtonVolume
