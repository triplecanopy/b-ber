/* eslint-disable no-param-reassign,prefer-rest-params */

import {debug, verboseOutput} from '../config'
import {noop} from '../helpers/utils'
import Messenger from '../lib/Messenger'

export default function deferrable(target) {

    const _componentWillMount = target.prototype.componentWillMount

    target.prototype.componentWillMount = function componentWillMount() {
        this.__defaultDeferredCallback = noop
        this.__deferredCallback = noop
        this.__deferredCallbackTimeout = null
        this.__deferredCallbackTimer = 200

        if (_componentWillMount) _componentWillMount.call(this, arguments)
    }

    target.prototype.registerDeferredCallback = function registerDeferredCallback(callback) {
        if (!callback) this.__deferredCallback = this.__defaultDeferredCallback
        if (debug && verboseOutput) console.log(`${target.name}#registerDeferredCallback`, callback.name)
        this.__deferredCallback = callback
    }

    target.prototype.deRegisterDeferredCallback = function deRegisterDeferredCallback() {
        if (debug && verboseOutput) console.log(`${target.name}#deRegisterDeferredCallback`, this.__deferredCallback.name)
        this.__deferredCallback = this.__defaultDeferredCallback
    }

    target.prototype.requestDeferredCallbackExecution = function requestDeferredCallbackExecution() {
        window.clearTimeout(this.__deferredCallbackTimeout)
        this.__deferredCallbackTimeout = setTimeout(_ => {

            Messenger.sendDeferredEvent()

            if (!this.canCallDeferred || !this.callDeferred) return
            if (this.canCallDeferred()) return this.callDeferred()
            this.requestDeferredCallbackExecution() // this needs calculateNodePosition() to have been called in Layout (via decorate-observable) to resolve

        }, this.__deferredCallbackTimer)
    }
    target.prototype.canCallDeferred = function canCallDeferred() { return true }

    target.prototype.registerCanCallDeferred = function registerCanCallDeferred(callback) {
        if (!callback || typeof callback !== 'function') return
        this.canCallDeferred = callback
    }

    target.prototype.callDeferred = function callDeferred() {
        if (debug && verboseOutput) console.log(`${target.name}#callDeferred`, this.__deferredCallback.name)
        this.__deferredCallback.call(this)
        this.deRegisterDeferredCallback()
    }
}
