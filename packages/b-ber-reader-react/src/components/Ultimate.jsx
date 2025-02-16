import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewActions from '../actions/view'
import * as userInterfaceActions from '../actions/user-interface'

const { requestAnimationFrame, cancelAnimationFrame } = window

class Ultimate extends React.Component {
  node = React.createRef()

  rAF = null

  maxChecks = 100

  // eslint-disable-next-line react/state-in-constructor
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

    if (!this.node?.current) return console.log('prevlefts no node')

    console.log('poll ...')

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
      console.log('--- ultimate calls load')

      // Hides spinner and makes app visible
      this.props.viewActions.load()

      this.props.viewActions.updateUltimateNodePosition({
        ultimateOffsetLeft,
      })

      this.props.userInterfaceActions.update({
        handleEvents: true,
        spinnerVisible: false,
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
  dispatch => ({
    userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
    viewActions: bindActionCreators(viewActions, dispatch),
  })
)(Ultimate)
