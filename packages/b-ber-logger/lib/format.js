'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.wrap = wrap;
exports.floatFormat = floatFormat;
exports.decorate = decorate;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function wrap(arr, space) {
    var _this = this;

    return arr.reduce(function (acc, curr) {
        var a = acc.split('\n');
        var l = a[a.length - 1].length;
        return acc.concat(l > _this.consoleWidth ? '\n' + space + curr + ', ' : curr + ', ');
    }, '').slice(0, -2);
}

function floatFormat(n) {

    var num = parseInt(n, 10);
    var len = String(num).length - 1;
    var pow = Math.floor(len / 3);

    var pows = ['B', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'];

    var fmt = (num / Math.pow(1000, pow)).toFixed(2);
    var str = '{' + fmt + ' ' + pows[pow] + '}';

    return this.decorate(str, 'black');
}

function decorate(_args) {
    var args = _args.constructor === Array ? _args : [_args];

    var message = _util2.default.format.apply(_util2.default, args);

    if (this.boringOutput === false) {
        for (var _len = arguments.length, props = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            props[_key - 1] = arguments[_key];
        }

        for (var i = props.length - 1; i >= 0; i--) {
            message = _chalk2.default[props[i]](message);
        }
    }

    return message;
}