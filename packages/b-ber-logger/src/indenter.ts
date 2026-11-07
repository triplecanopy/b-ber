import type { Logger } from './logger'

export function indent(this: Logger): string {
  return this.whitespace.repeat(this.indentLevel)
}

export function incrementIndent(this: Logger): void {
  this.indentLevel += this.increment
}

export function decrementIndent(this: Logger): void {
  this.indentLevel -= this.increment
}

export function incrementCounter(this: Logger): void {
  this.taskCounter += 1
}

export function decrementCounter(this: Logger): void {
  this.taskCounter -= 1
}
