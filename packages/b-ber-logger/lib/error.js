'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.error = error;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function error() {

    if (this.logLevel < 1) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 0);
    var errCode = 1;

    var message = void 0;
    var stack = void 0;

    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message]);
        stack = args[0].stack;
    } else {
        message = this.composeMessage(args);

        var _ref = new Error();

        stack = _ref.stack;
    }

    var counter = this.counter();
    var context = this.getContext();

    var errorText = 'ERROR';
    var error = this.decorate(errorText, 'red', 'underline');
    var offset = counter.length + errorText.length + 3;

    var formatted = _util2.default.format.apply(_util2.default, ['%s %s', counter, error, this.indent().substring(offset), message]);

    this.taskErrors += 1;
    this.errors.push({
        stack: stack,
        message: message,
        formatted: formatted
    });

    console.log(formatted);
    console.log();
    console.log(stack);
    console.log();
    console.log(this.decorate('b-ber exited with code ' + errCode, 'red'));
    process.exit(errCode);
}