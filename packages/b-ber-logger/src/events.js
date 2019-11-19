/* eslint-disable import/prefer-default-export */

export function notify(event, data) {
  this[event].call(this, data)
}
