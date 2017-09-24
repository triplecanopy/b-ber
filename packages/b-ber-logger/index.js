'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

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

var _store = require('../b-ber-create/src/bber-lib/store');

var _store2 = _interopRequireDefault(_store);

var _timer = require('./lib/timer');

var _timer2 = _interopRequireDefault(_timer);

var _printer = require('./lib/printer');

var _indenter = require('./lib/indenter');

var _listeners = require('./lib/listeners');

var _events = require('./lib/events');

var _warn = require('./lib/warn');

var _info = require('./lib/info');

var _error = require('./lib/error');

var _debug = require('./lib/debug');

var _trace = require('./lib/trace');

var _inspect = require('./lib/inspect');

var _summary = require('./lib/summary');

var _configure = require('./lib/configure');

var _register = require('./lib/register');

var _format = require('./lib/format');

var _context = require('./lib/context');

var _compose = require('./lib/compose');

var _reset = require('./lib/reset');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Logger = function (_Timer) {
    (0, _inherits3.default)(Logger, _Timer);

    function Logger() {
        (0, _classCallCheck3.default)(this, Logger);

        var _this = (0, _possibleConstructorReturn3.default)(this, (Logger.__proto__ || (0, _getPrototypeOf2.default)(Logger)).call(this));

        _this.logLevel = Logger.defaults.logLevel;
        _this.boringOutput = Logger.defaults.boringOutput;
        _this.command = Logger.defaults.command;
        _this.consoleWidth = Logger.defaults.consoleWidth;
        _this.errors = Logger.defaults.errors;
        _this.warnings = Logger.defaults.warnings;

        _this.taskWarnings = Logger.defaults.taskWarnings;
        _this.taskErrors = Logger.defaults.taskErrors;

        _this.whitespace = Logger.defaults.whitespace;
        _this.increment = Logger.defaults.increment;
        _this.indentLevel = Logger.defaults.indentLevel;
        _this.taskCounter = Logger.defaults.taskCounter;
        _this.context = Logger.defaults.context;

        // options
        _this.settings = {
            quiet: false,
            verbose: false,
            debug: false,
            summarize: Logger.defaults.summarize,
            'no-color': Logger.defaults.boringOutput,
            'log-level': Logger.defaults.logLevel

            // bindings
        };_this.printWarnings = _printer.printWarnings.bind(_this);
        _this.printErrors = _printer.printErrors.bind(_this);

        _this.indent = _indenter.indent.bind(_this);
        _this.incrementIndent = _indenter.incrementIndent.bind(_this);
        _this.decrementIndent = _indenter.decrementIndent.bind(_this);
        _this.incrementCounter = _indenter.incrementCounter.bind(_this);
        _this.decrementCounter = _indenter.decrementCounter.bind(_this);

        _this.warn = _warn.warn.bind(_this);
        _this.info = _info.info.bind(_this);
        _this.error = _error.error.bind(_this);
        _this.debug = _debug.debug.bind(_this);
        _this.trace = _trace.trace.bind(_this);
        _this.inspect = _inspect.inspect.bind(_this);
        _this.summary = _summary.summary.bind(_this);

        _this.bind = _listeners.bind.bind(_this);
        _this.notify = _events.notify.bind(_this);

        _this.configure = _configure.configure.bind(_this);
        _this.registerSequence = _register.registerSequence.bind(_this);

        _this.wrap = _format.wrap.bind(_this);
        _this.decorate = _format.decorate.bind(_this);
        _this.floatFormat = _format.floatFormat.bind(_this);

        _this.counter = _context.counter.bind(_this);
        _this.getContext = _context.getContext.bind(_this);

        _this.composeMessage = _compose.composeMessage.bind(_this);
        _this.reset = _reset.reset.bind(_this);

        // parse args
        var argv = process.argv.reduce(function (acc, curr) {
            var _curr$split = curr.split('='),
                _curr$split2 = (0, _slicedToArray3.default)(_curr$split, 2),
                k = _curr$split2[0],
                v = _curr$split2[1];

            acc[k] = typeof v === 'undefined' ? true : !isNaN(v) ? Number(v) : v;
            return acc;
        }, {});

        (0, _keys2.default)(_this.settings).forEach(function (_) {
            var opt = '--' + _;
            if ({}.hasOwnProperty.call(argv, opt)) {
                _this.settings[_] = argv[opt];
            }
        });

        _this.configure();
        _this.bind();
        return _this;
    }

    (0, _createClass3.default)(Logger, [{
        key: 'printSummary',
        value: function printSummary(data) {
            this.summary((0, _extends3.default)({ store: _store2.default }, data));
        }
    }]);
    return Logger;
}(_timer2.default);

Logger.defaults = {
    logLevel: 3,
    boringOutput: false,
    summarize: false,
    command: null,
    consoleWidth: 70,
    errors: [],
    warnings: [],

    taskWarnings: 0,
    taskErrors: 0,

    whitespace: ' ',
    increment: 4,
    indentLevel: 4,
    taskCounter: -1,
    context: null
};


var log = new Logger();
exports.default = log;

