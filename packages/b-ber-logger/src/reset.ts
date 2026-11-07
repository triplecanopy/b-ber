import type { Logger } from './logger'

export function reset(this: Logger): void {
  this.errors = []
  this.warnings = []
}
