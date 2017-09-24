'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.info = info;
function info() {

    if (this.logLevel < 3) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 0);

    var counter = this.counter();
    var context = this.getContext();
    var message = this.decorate(this.composeMessage(args), 'cyan');

    var prefix = '';
    if (context) {
        if (this.command === 'build') {
            // TODO: handle this better; don't show first line whitespace on standalone command
            if (this.logLevel > 3) {
                console.log();
            }
        }
        this.decrementIndent();
        console.log(this.indent() + this.decorate('Using [' + context + ']', 'cyan'));
        this.incrementIndent();
    }

    prefix += '' + counter + this.indent().substring(counter.length);

    if (this.logLevel < 4) {
        return;
    }

    console.log('' + prefix + message);
}