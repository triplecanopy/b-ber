import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewActions from '../actions/view'

const intervalSpeed = 60

class Ultimate extends React.Component {
  node = React.createRef()
  interval = null
  state = { left: 0, leftChecks: [] }

  componentDidMount() {
    this.poll()
  }

  componentWillUnmount() {
    this.cancel()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.view.loaded === true && nextProps.view.loaded === false) {
      console.log('starts polling')
      this.poll()
    }
  }

  cancel = () => {
    console.log('cancel polling')
    clearInterval(this.interval)
  }

  poll = () => {
    this.interval = setInterval(() => {
      if (!this.node?.current) return

      let { leftChecks } = this.state
      const left = this.node.current.offsetLeft

      if (leftChecks.length < 5) {
        if (leftChecks.some(n => n !== left)) {
          leftChecks = [left]
        } else {
          leftChecks.push(left)
        }

        // console.log('leftChecks', leftChecks)

        this.setState({ leftChecks })
      } else {
        console.log('updates', left)
        leftChecks = []
        this.setState({ left, leftChecks }, () => {
          console.log('calls load from ultimate')

          this.props.viewActions.load()
          this.props.viewActions.setUltimateLeft(left)
          this.cancel()
        })
      }
    }, intervalSpeed)
  }

  render() {
    return (
      <span ref={this.node} className="ultimate">
        {this.props.children}
      </span>
    )
  }
}

export default connect(
  ({ view }) => ({ view }),
  dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
)(Ultimate)
