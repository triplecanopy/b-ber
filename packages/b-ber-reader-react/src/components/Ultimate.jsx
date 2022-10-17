import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewActions from '../actions/view'

const { requestAnimationFrame, cancelAnimationFrame } = window

class Ultimate extends React.Component {
  node = React.createRef()

  rAF = null

  maxChecks = 5

  state = { prevLefts: [] }

  componentDidMount() {
    this.poll()
  }

  componentWillUnmount() {
    this.cancel()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.view.loaded === true && nextProps.view.loaded === false) {
      this.poll()
    }
  }

  cancel = () => {
    cancelAnimationFrame(this.rAF)
  }

  poll = () => {
    this.rAF = requestAnimationFrame(this.poll)

    if (!this.node?.current) return

    let { prevLefts } = this.state
    const ultimateOffsetLeft = this.node.current.offsetLeft

    if (prevLefts.length < this.maxChecks) {
      prevLefts = prevLefts.some(n => n !== ultimateOffsetLeft)
        ? [ultimateOffsetLeft]
        : prevLefts.concat(ultimateOffsetLeft)

      this.setState({ prevLefts })
      return
    }

    prevLefts = []
    this.setState({ prevLefts }, () => {
      this.props.viewActions.load()
      this.props.viewActions.updateUltimateNodePosition({
        ultimateOffsetLeft,
      })
      this.cancel()
    })
  }

  render() {
    return (
      <span ref={this.node} className="bber-ultimate">
        {this.props.children}
      </span>
    )
  }
}

export default connect(
  ({ view }) => ({ view }),
  dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
)(Ultimate)
