'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bind = bind;
function bind() {
    var _this = this;

    this.on('begin', function (_ref) {
        var task = _ref.task,
            begin = _ref.begin;


        _this.task = task;
        _this.taskWarnings = 0;
        _this.taskErrors = 0;

        if (_this.logLevel < 3) {
            _this.incrementIndent();
            return;
        }

        console.log('%s%s [%s]', _this.indent(), 'Starting', task);

        _this.incrementIndent();
    });

    this.on('end', function (_ref2) {
        var task = _ref2.task,
            taskTime = _ref2.taskTime;


        _this.decrementIndent();

        if (_this.logLevel < 3) {
            return;
        }

        var beginMs = taskTime.beginMs,
            endMs = taskTime.endMs,
            totalMs = taskTime.totalMs;


        if (_this.logLevel > 3) {
            _this.incrementIndent();
            console.log();
            console.log('%s%s %s', _this.indent(), 'Start', beginMs);
            console.log('%s%s %s', _this.indent(), 'End', endMs);
            console.log('%s%s %s', _this.indent(), 'Elapsed', totalMs);
            console.log();
            _this.decrementIndent();
        }

        console.log(_this.decorate(['%s%s [%s] after %s', _this.indent(), 'Finished', task, totalMs], 'green'));
        console.log();

        if (_this.taskWarnings) {
            _this.printWarnings(task);
        }

        if (_this.taskErrors) {
            _this.printErrors(task);
        }
    });

    this.on('done', function (data) {
        if (_this.logLevel < 3) {
            console.log();
        }
        if (!_this.errors.length) {
            console.log('%s%s', _this.indent(), _this.decorate('Build succeeded', 'green', 'underline'));
            console.log();
        } else {
            console.log('%s%s', _this.indent(), _this.decorate('Build error', 'red', 'underline'));
            console.log();
        }

        _this.printSummary(data);
    });
}