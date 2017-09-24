'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.inspect = inspect;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function inspect(args) {
    return console.log(_util2.default.inspect(args, true, null, true));
}