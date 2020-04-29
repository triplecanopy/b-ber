import { rand } from '../helpers/utils'
import { messagesTypes } from '../constants'
import { PageEvent, DeferredEvent } from '../models'

const registry = new Map()

class Messenger {
  static MESSAGE_DOMAIN = '*'

  static getListeners() {
    return registry
  }

  static getConstants() {
    return messagesTypes
  }

  static getDomain() {
    return Messenger.MESSAGE_DOMAIN
  }

  static sendPaginationEvent({
    spreadIndex,
    lastSpreadIndex,
    firstSpread,
    lastSpread,
    firstChapter,
    lastChapter,
    spreadDelta,
  }) {
    const event = new PageEvent({
      spreadIndex,
      lastSpreadIndex,
      firstChapter,
      lastChapter,
      firstSpread,
      lastSpread,
      spreadDelta,
    })

    window.parent.postMessage(event, Messenger.MESSAGE_DOMAIN)
  }

  static sendDeferredEvent() {
    const event = new DeferredEvent()
    window.parent.postMessage(event, Messenger.MESSAGE_DOMAIN)
  }

  static sendClickEvent(event) {
    window.parent.postMessage(
      { ...event, type: messagesTypes.CLICK_EVENT },
      Messenger.MESSAGE_DOMAIN
    )
  }

  static sendDownloadEvent(url) {
    window.parent.postMessage(
      { url, type: messagesTypes.DOWNLOAD_EVENT },
      Messenger.MESSAGE_DOMAIN
    )
  }

  static sendKeydownEvent(event) {
    window.parent.postMessage(
      {
        ...event,
        keyCode: event.keyCode,
        metaKey: event.metaKey,
        type: messagesTypes.KEYDOWN_EVENT,
      },
      Messenger.MESSAGE_DOMAIN
    )
  }

  static register(callback, type = null) {
    const key = rand()
    const event = 'message'
    const handler = e => (!type || type === e.data.type) && callback(e)

    registry.set(key, { event, type, handler, callback })
    window.addEventListener(event, handler)

    return key
  }

  static deregister(key) {
    if (!key) return

    const { handler } = registry.get(key)
    window.removeEventListener('message', handler)
    registry.delete(key)
  }

  static clear() {
    registry.forEach((entry, key) => entry.handler && Messenger.deregister(key))
    registry.clear()
  }
}

export default Messenger
