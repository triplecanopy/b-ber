'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.printWarnings = printWarnings;
exports.printErrors = printErrors;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function printNotices(type) {
    var _this = this;

    var task = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'b-ber';

    var prop = task ? 'task' + type[0].toUpperCase() + type.slice(1) : type;
    var notices = this[type].slice(this[prop] * -1);
    var leader = type === 'warnings' ? 'WARN' : 'ERROR';
    var header = _util2.default.format.apply(_util2.default, ['[%s] emitted [%d] %s', task, notices.length, type]);
    var color = type === 'warnings' ? 'yellow' : 'red';

    if (this.logLevel > 3) {
        console.log('%s%s', this.indent(), this.decorate(header, color, 'underline'));

        this.incrementIndent();
        notices.forEach(function (_) {

            console.log();
            console.log('%s%s %s', _this.indent(), _this.decorate(leader, color, 'underline'), _this.decorate(_.message, 'cyan'));

            if (_this.logLevel > 1) {
                var stack = _.stack.split('\n').slice(2).map(function (s) {
                    return s.replace(/^\s+/, _this.indent());
                }).join('\n');
                console.log('%s', stack);
            }
        });
        this.decrementIndent();
    }
}

function printWarnings(task) {
    printNotices.call(this, 'warnings', task);
}
function printErrors(task) {
    printNotices.call(this, 'errors', task);
}