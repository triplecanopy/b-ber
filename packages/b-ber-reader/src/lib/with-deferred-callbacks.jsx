import React from 'react'
import Messenger from './Messenger'
import { DEFERRED_CALLBACK_TIMER } from '../constants'

function withDeferredCallbacks(WrappedComponent) {
  let deferredCallbacks = []
  let deferredCallbackTimeout = null

  return class extends React.Component {
    // eslint-disable-next-line class-methods-use-this
    registerDeferredCallback(callback) {
      if (!callback) throw new Error('No callback provided')
      deferredCallbacks.push(callback)
    }

    // eslint-disable-next-line class-methods-use-this
    deRegisterDeferredCallback() {
      deferredCallbacks = []
    }

    requestDeferredCallbackExecution() {
      clearTimeout(deferredCallbackTimeout)

      deferredCallbackTimeout = setTimeout(() => {
        Messenger.sendDeferredEvent()

        // This needs calculateNodePosition() to have been called in Layout (via
        // decorate-observable) to resolve
        return this.callDeferred()
      }, DEFERRED_CALLBACK_TIMER)
    }

    callDeferred() {
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
}

export default withDeferredCallbacks
