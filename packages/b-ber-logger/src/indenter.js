export function indent() {
    return this.whitespace.repeat(this.indentLevel)
}
export function incrementIndent() {
    this.indentLevel += this.increment
}
export function decrementIndent() {
    this.indentLevel -= this.increment
}
export function incrementCounter() {
    this.taskCounter += 1
}
export function decrementCounter() {
    this.taskCounter -= 1
}
