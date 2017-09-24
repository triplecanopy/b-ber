'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.warn = warn;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function warn() {

    if (this.logLevel < 2) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 0);

    var message = this.composeMessage(args);
    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message]);
    } else {
        message = this.composeMessage(args);
    }

    var counter = this.counter();
    var context = this.getContext();

    var _ref = new Error(),
        stack = _ref.stack;

    var warningText = 'WARN';
    var warn = this.decorate(warningText, 'yellow', 'underline');
    var offset = counter.length + warningText.length + 3; // ?


    var formatted = _util2.default.format.apply(_util2.default, ['%s %s', counter, warn, this.indent().substring(offset), message]);

    this.taskWarnings += 1;
    this.warnings.push({
        stack: stack,
        message: message,
        formatted: formatted
    });

    console.log(formatted);
}