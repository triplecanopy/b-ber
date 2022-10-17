import { messagesTypes } from '../constants'

export default class DeferredEvent {
  constructor() {
    this.origin = window.location.origin
    this.type = messagesTypes.DEFERRED_EVENT
  }
}
