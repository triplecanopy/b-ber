'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.registerSequence = registerSequence;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function registerSequence(store, command, commanders, sequences) {
    var _this = this;

    this.command = command;
    if (command !== 'build') {
        return;
    } // TODO: should handle this better when showing `fail`

    if (this.logLevel < 3) {
        return;
    }

    var sequence = store.sequence;


    console.log();
    console.log('%sStarting [%s]', this.indent(), command);

    this.incrementIndent();

    console.log('%sPreparing to run [%d] tasks', this.indent(), sequence.length);
    console.log('%sRunning the following tasks', this.indent());
    console.log();

    if ((0, _keys2.default)(commanders).length) {
        var cmds = (0, _keys2.default)(commanders).filter(function (_) {
            return commanders[_];
        });
        cmds.forEach(function (_) {
            console.log('' + _this.indent() + command + ':' + _);
            _this.incrementIndent();
            console.log('' + _this.indent() + _this.wrap(sequences[_], _this.indent()));
            _this.decrementIndent();
            console.log();
        });
    } else {
        console.log('' + this.indent() + this.wrap(sequence, this.indent()));
    }
}