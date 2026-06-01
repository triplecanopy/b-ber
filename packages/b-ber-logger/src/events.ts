export function notify(this: any, event: string, data: unknown): void {
  this[event].call(this, data)
}
