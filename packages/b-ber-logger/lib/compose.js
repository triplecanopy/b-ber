'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.composeMessage = composeMessage;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function abbrvFilename(filename) {
    return _path2.default.basename(_path2.default.dirname(filename)) + _path2.default.sep + _path2.default.basename(filename);
}

function composeMessage(args) {
    var _this = this;

    var message = '';
    message = _util2.default.format.apply(_util2.default, args);
    message = message.replace(/(\/\w+[^\]]+)/, function (s) {
        return abbrvFilename(s);
    });
    message = message.replace(/\{(\d+)\}/, function (_, d) {
        return _this.floatFormat(d);
    });
    return message;
}