import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import * as viewActions from '../actions/view'
import { DEFERRED_CALLBACK_TIMER } from '../constants'

function withDeferredCallbacks(WrappedComponent) {
  let deferredCallbacks = []

  class WrapperComponent extends React.Component {
    registerDeferredCallback = callback => {
      if (!callback) throw new Error('No callback provided')
      deferredCallbacks.push(callback)
      this.props.viewActions.queueDeferredCallbacks()
    }

    deRegisterDeferredCallback = () => {
      deferredCallbacks = []
      setImmediate(() => this.props.viewActions.dequeueDeferredCallbacks())
    }

    requestDeferredCallbackExecution = debounce(
      () => this.callDeferred(),
      DEFERRED_CALLBACK_TIMER,
      { leading: false, trailing: true }
    )

    callDeferred = () => {
      deferredCallbacks.forEach(callback => callback())
      this.deRegisterDeferredCallback()
    }

    render() {
      return (
        <WrappedComponent
          registerDeferredCallback={this.registerDeferredCallback}
          deRegisterDeferredCallback={this.deRegisterDeferredCallback}
          requestDeferredCallbackExecution={
            this.requestDeferredCallbackExecution
          }
          callDeferred={this.callDeferred}
          {...this.props}
        />
      )
    }
  }

  return connect(
    () => ({}),
    dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
  )(WrapperComponent)
}

export default withDeferredCallbacks
