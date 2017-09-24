'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

exports.summary = summary;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function printNavigationTree(store) {
    var _this = this;

    console.log('%s%s', this.indent(), this.decorate('Structure', 'cyan'));
    this.incrementIndent();

    function parse(items) {
        items.forEach(function (item) {
            console.log('%s%s', _this.indent(), item.title || '[' + item.name + ']');
            if (item.nodes && item.nodes.length) {
                _this.incrementIndent();
                parse(item.nodes);
                _this.decrementIndent();
            }
        });
    }

    parse(store.toc);

    this.decrementIndent();
}

function summary(_ref) {
    var _this2 = this;

    var store = _ref.store,
        taskTimes = _ref.taskTimes,
        formattedStartDate = _ref.formattedStartDate,
        formattedEndDate = _ref.formattedEndDate,
        sequenceEnd = _ref.sequenceEnd;


    if (this.logLevel < 4 && this.summarize !== true) {
        return;
    }

    console.log('%s%s', this.indent(), '-'.repeat(this.consoleWidth));
    console.log();
    console.log('%s%s', this.indent(), 'Summary');
    console.log();
    console.log('%s%s', this.indent(), '-'.repeat(this.consoleWidth));
    console.log();

    console.log(this.decorate('%sBuild start: %s', 'cyan'), this.indent(), formattedStartDate);
    console.log(this.decorate('%sBuild end: %s', 'cyan'), this.indent(), formattedEndDate);
    console.log(this.decorate('%sElapsed time: %s', 'cyan'), this.indent(), sequenceEnd);
    console.log();

    this.printWarnings();
    console.log();

    this.printErrors();
    console.log();

    console.log(this.decorate('%sConfiguration', 'cyan'), this.indent());
    this.incrementIndent();
    (0, _entries2.default)(store.config).forEach(function (_ref2) {
        var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
            k = _ref3[0],
            v = _ref3[1];

        console.log('%s%s: %s', _this2.indent(), k, v);
    });
    this.decrementIndent();
    console.log();

    console.log(this.decorate('%sMetadata', 'cyan'), this.indent());
    this.incrementIndent();
    store.metadata.forEach(function (_) {
        console.log('%s%s: %s', _this2.indent(), _.term, _.value);
    });
    this.decrementIndent();
    console.log();

    printNavigationTree.call(this, store);
    console.log();
    console.log('%s%s %s %s', this.indent(), 'Created', store.spine.length, 'XHTML file(s)');
    console.log('%s%s %s %s', this.indent(), 'Created', store.figures.length, 'figures(s)');
    console.log();
    console.log('%s%s %s', this.indent(), 'b-ber version', store.version);
    console.log();
}