import type { Logger } from './logger'

export function notify(this: Logger, event: string, data: unknown): void {
  // `event` names one of the logger's own methods: `done`, `start` or `stop`
  ;(this as unknown as Record<string, (data: unknown) => void>)[event].call(
    this,
    data
  )
}
