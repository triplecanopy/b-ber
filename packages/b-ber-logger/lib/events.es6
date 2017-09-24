export function notify(event, data) {
    this[event].call(this, data)
}
