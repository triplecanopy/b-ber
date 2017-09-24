"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.indent = indent;
exports.incrementIndent = incrementIndent;
exports.decrementIndent = decrementIndent;
exports.incrementCounter = incrementCounter;
exports.decrementCounter = decrementCounter;
function indent() {
    return this.whitespace.repeat(this.indentLevel);
}
function incrementIndent() {
    this.indentLevel += this.increment;
}
function decrementIndent() {
    this.indentLevel -= this.increment;
}
function incrementCounter() {
    this.taskCounter += 1;
}
function decrementCounter() {
    this.taskCounter -= 1;
}