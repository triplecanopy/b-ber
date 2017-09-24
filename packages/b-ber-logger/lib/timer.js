'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Timer = function (_EventEmitter) {
    (0, _inherits3.default)(Timer, _EventEmitter);

    function Timer() {
        (0, _classCallCheck3.default)(this, Timer);

        var _this = (0, _possibleConstructorReturn3.default)(this, (Timer.__proto__ || (0, _getPrototypeOf2.default)(Timer)).call(this));

        _this.taskBegin = null;
        _this.taskEnd = null;

        _this.sequenceBegin = null;
        _this.formattedStartDate = null;
        _this.taskTimes = null;

        _this.prepare();

        return _this;
    }

    (0, _createClass3.default)(Timer, [{
        key: 'hrtimeformat',
        value: function hrtimeformat(t) {
            var s = t[0] * 1000 + t[1] / 1000000;
            return String(s).slice(0, -3) + 'ms';
        }
    }, {
        key: 'prepare',
        value: function prepare() {
            this.sequenceBegin = process.hrtime();
            this.formattedStartDate = new Date().toLocaleDateString('en-CA', Timer.dateFormattingOptions);

            this.taskTimes = [];
        }
    }, {
        key: 'start',
        value: function start(task) {
            this.taskBegin = process.hrtime(this.sequenceBegin);
            this.emit('begin', { task: task, begin: this.taskBegin });
        }
    }, {
        key: 'stop',
        value: function stop(task) {
            this.taskEnd = process.hrtime(this.sequenceBegin);

            var beginMs = this.hrtimeformat(this.taskBegin);
            var endMs = this.hrtimeformat(this.taskEnd);
            var totalMs = (parseFloat(endMs, 10) - parseFloat(beginMs, 10)).toFixed(3) + 'ms';

            var taskTime = {
                taskName: task,
                beginHrtime: this.taskBegin,
                endHrtime: this.taskEnd,
                beginMs: beginMs,
                endMs: endMs,
                totalMs: totalMs
            };

            this.taskTimes.push(taskTime);

            this.emit('end', { task: task, taskTime: taskTime });
        }
    }, {
        key: 'done',
        value: function done() {
            var taskTimes = this.taskTimes,
                formattedStartDate = this.formattedStartDate;

            var formattedEndDate = new Date().toLocaleDateString('en-CA', Timer.dateFormattingOptions);
            var sequenceEnd = this.hrtimeformat(process.hrtime(this.sequenceBegin));

            this.emit('done', { taskTimes: taskTimes, formattedStartDate: formattedStartDate, formattedEndDate: formattedEndDate, sequenceEnd: sequenceEnd });
        }
    }]);
    return Timer;
}(_events.EventEmitter);

Timer.dateFormattingOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
};
exports.default = Timer;