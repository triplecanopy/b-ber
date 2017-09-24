'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.counter = counter;
exports.getContext = getContext;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ctx(filename) {
    return _path2.default.basename(_path2.default.dirname(filename)) + _path2.default.sep + _path2.default.basename(filename, _path2.default.extname(filename));
}

function counter() {
    this.incrementCounter();
    return '[' + this.taskCounter + ']';
}
function getContext() {
    var _ref = new Error(),
        stack = _ref.stack;

    var message = stack.split('\n');
    var context = message[3].replace(/^\s+at[^\/]+(\/[^:]+):.+$/, function (_, m) {
        return ctx(m);
    });

    if (context !== this.context) {
        this.context = context;
    } else {
        return '';
    }
    return context;
}