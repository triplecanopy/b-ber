export function indent(this: any): string {
  return this.whitespace.repeat(this.indentLevel)
}

export function incrementIndent(this: any): void {
  this.indentLevel += this.increment
}

export function decrementIndent(this: any): void {
  this.indentLevel -= this.increment
}

export function incrementCounter(this: any): void {
  this.taskCounter += 1
}

export function decrementCounter(this: any): void {
  this.taskCounter -= 1
}
