import React from 'react'
import classNames from 'classnames'
import MediaRangeSlider from './MediaRangeSlider'

class MediaButtonVolume extends React.Component {
  state = { open: false }

  toggle = () => this.setState({ open: !this.state.open })

  render() {
    const { open } = this.state

    return (
      <>
        <div className={classNames('slider__volume', { open })}>
          <MediaRangeSlider
            duration={1} // max vol
            progress={this.props.volume} // current vol
            seek={this.props.updateVolume} // change handler
          />
        </div>
        <button
          className={classNames('material-icons media__button__volume_up', {
            hover: open,
          })}
          onClick={this.toggle}
        >
          volume_up
        </button>
      </>
    )
  }
}

export default MediaButtonVolume
