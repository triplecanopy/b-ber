<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

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

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _findIndex = require('lodash/findIndex');

var _findIndex2 = _interopRequireDefault(_findIndex);

var _ApplicationLoader2 = require('./ApplicationLoader');

var _ApplicationLoader3 = _interopRequireDefault(_ApplicationLoader2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dynamicPageTmpl = function dynamicPageTmpl(_) {
    throw new Error('[state.templates#dynamicPageTmpl] has not been initialized in b-ber-modifiers/inject');
};
var dynamicPageHead = function dynamicPageHead(_) {
    throw new Error('[state.templates#dynamicPageHead] has not been initialized in b-ber-modifiers/inject');
};
var dynamicPageTail = function dynamicPageTail(_) {
    throw new Error('[state.templates#dynamicPageTail] has not been initialized in b-ber-modifiers/inject');
};

var State = function (_ApplicationLoader) {
    (0, _inherits3.default)(State, _ApplicationLoader);

    function State() {
        (0, _classCallCheck3.default)(this, State);

        var _this = (0, _possibleConstructorReturn3.default)(this, (State.__proto__ || (0, _getPrototypeOf2.default)(State)).call(this));

        (0, _entries2.default)(State.defaults).forEach(function (_ref) {
            var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
                key = _ref2[0],
                val = _ref2[1];

            return _this[key] = val;
        });
        _this.load();
        return _this;
    }

    (0, _createClass3.default)(State, [{
        key: 'reset',
        value: function reset() {
            var _this2 = this;

            (0, _entries2.default)(State.defaults).forEach(function (_ref3) {
                var _ref4 = (0, _slicedToArray3.default)(_ref3, 2),
                    key = _ref4[0],
                    val = _ref4[1];

                return _this2[key] = val;
            });
            this.templates = { dynamicPageTmpl: dynamicPageTmpl, dynamicPageHead: dynamicPageHead, dynamicPageTail: dynamicPageTail };
            this.hash = _crypto2.default.randomBytes(20).toString('hex');
        }

        /**
         * Add an entry to an Object or Array property of State
         * @param  {String} prop Property name
         * @param {*}       val Value to add
         * @return {*}
         */

    }, {
        key: 'add',
        value: function add(prop, val) {
            if ((0, _isArray2.default)(this[prop])) {
                this[prop] = [].concat((0, _toConsumableArray3.default)(this[prop]), [val]);
                return;
            }

            if ((0, _isPlainObject2.default)(this[prop])) {
                this[prop] = (0, _extends3.default)({}, this[prop], { val: val });
                return;
            }

            if (typeof this[prop] === 'string') {
                this[prop] = this[prop] + String(val);
                return;
            }

            throw new Error('Something went wrong in `State#add`');
        }

        /**
         * Remove an entry from an Object or Array
         * @param  {String} prop Property name
         * @param  {*}      val Value to remove
         * @return {*}
         */

    }, {
        key: 'remove',
        value: function remove(prop, val) {
            if ((0, _isArray2.default)(this[prop])) {
                // const index = this[prop].indexOf(val)
                var index = (0, _findIndex2.default)(this[prop], val);
                if (index < 0) throw new TypeError('The _property [' + val + '] could not be found in [state.' + prop + ']');
                this[prop].splice(index, 1);
                return;
            }

            if ((0, _isPlainObject2.default)(this[prop])) {
                delete this[prop][val];
                return;
            }

            throw new Error('Something went wrong in `State#remove`');
        }

        /**
         * Merge an Object into a property of State
         * @param  {String} prop State key
         * @param  {Object} val  Object to merge into `key`
         * @return {Object}      Merged object
         */

    }, {
        key: 'merge',
        value: function merge(prop, val) {
            if (!(0, _isPlainObject2.default)(this[prop]) || !(0, _isPlainObject2.default)(val)) throw new Error('Attempting to merge non-object in [State#merge]');
            this[prop] = (0, _extends3.default)({}, this[prop], val);
        }

        /**
         * Update a property of State
         * Accepts nested objects up to one level
         * @param  {String} prop Property name
         * @param  {*} val  New value
         * @return {*}      Updated property
         * @example         state.update('config.baseurl', '/')
         */

    }, {
        key: 'update',
        value: function update(prop, val) {
            var _prop$split = prop.split('.'),
                _prop$split2 = (0, _slicedToArray3.default)(_prop$split, 2),
                key = _prop$split2[0],
                rest = _prop$split2[1];

            if ({}.hasOwnProperty.call(this, key)) {
                if (rest) {
                    this[key][rest] = val;
                } else {
                    this[key] = val;
                }
            }

            return this[key];
        }

        /**
         * [contains description]
         * @param  {String} collection  [description]
         * @param  {String} value       [description]
         * @return {Integer}
         */

    }, {
        key: 'contains',
        value: function contains(collection, value) {
            if (!(0, _isArray2.default)(this[collection])) throw new TypeError('[State#contains] must be called on an array');
            return (0, _findIndex2.default)(this[collection], value);
        }
    }, {
        key: 'src',
        get: function get() {
            return this.config.src;
        },
        set: function set(val) {
            this.config.src = val;
        }
    }, {
        key: 'dist',
        get: function get() {
            if (this.build && this.buildTypes && this.buildTypes[this.build]) {
                return this.buildTypes[this.build].dist;
            }
            return this.config.dist;
        },
        set: function set(val) {
            this.config.dist = val;
        }
    }, {
        key: 'theme',
        get: function get() {
            return this.config.theme;
        },
        set: function set(val) {
            this.config.theme = val;
        }
    }, {
        key: 'env',
        get: function get() {
            // eslint-disable-line class-methods-use-this
            return process.env.NODE_ENV || 'development';
        },
        set: function set(val) {
            this.config.env = val;
        }
    }]);
    return State;
}(_ApplicationLoader3.default);

State.defaults = {
    guide: [],
    figures: [],
    footnotes: [],
    build: 'epub',
    cursor: [],
    spine: [],
    toc: [],
    remoteAssets: [],
    loi: [],
    sequence: [],
    hash: _crypto2.default.randomBytes(20).toString('hex'),

    // for dynamically created templates. functions here are overwritten
    // during build. see b-ber-modifiers/inject#mapSourcesToDynamicPageTemplate
    templates: { dynamicPageTmpl: dynamicPageTmpl, dynamicPageHead: dynamicPageHead, dynamicPageTail: dynamicPageTail }
};


var state = new State();
exports.default = state;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _lodash = require('lodash');

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bBerThemes = require('@canopycanopycanopy/b-ber-themes');

var _bBerThemes2 = _interopRequireDefault(_bBerThemes);

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

var _helpers = require('./helpers');

var _YamlAdaptor = require('./YamlAdaptor');

var _YamlAdaptor2 = _interopRequireDefault(_YamlAdaptor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable global-require, import/no-dynamic-require */
var cwd = process.cwd();

var BBER_MODULE_PATH = _path2.default.dirname(_path2.default.dirname(__dirname));
var BBER_PACKAGE_JSON = require(_path2.default.join(BBER_MODULE_PATH, 'package.json')); // eslint-disable-line import/no-dynamic-require


function dynamicPageTmpl() {
    throw new Error('[state.templates#dynamicPageTmpl] has not been initialized in b-ber-modifiers/inject');
}
function dynamicPageHead() {
    throw new Error('[state.templates#dynamicPageHead] has not been initialized in b-ber-modifiers/inject');
}
function dynamicPageTail() {
    throw new Error('[state.templates#dynamicPageTail] has not been initialized in b-ber-modifiers/inject');
}

/**
 * @class State
 */

var State = function () {
    /**
     * @constructor
     * @return {Object} Instance of State
     */
    function State() {
        (0, _classCallCheck3.default)(this, State);

        this.guide = null;
        this.figures = null;
        this.video = null;
        this.audio = null;
        this.footnotes = null;
        this.build = null;
        this.builds = null;
        this.cursor = null;
        this.config = {};
        this.metadata = null;
        this.version = null;
        this.spine = null;
        this.toc = null;
        this.remoteAssets = null;
        this.loi = null;
        this.theme = null;
        this.sequence = null;
        this.hash = null;

        this.loadInitialState();
    }

    (0, _createClass3.default)(State, [{
        key: '_checkTypes',


        /**
         * Validate input before getting/setting State properties
         * @param  {String} prop Property to validate
         * @param  {*}      val  Value to validate (not `undefined`)
         * @return {Object}
         */
        value: function _checkTypes(prop, val) {
            var _prop = prop;
            var _val = val;
            if (!{}.hasOwnProperty.call(this, _prop)) {
                throw new TypeError('Attempting to add non-existent property [' + prop + '] to class [State]'); // eslint-disable-line max-len
            }

            if (typeof _val === 'undefined') {
                throw new TypeError('Property [' + prop + '] cannot be set to [undefined]');
            }

            return { _prop: _prop, _val: _val };
        }
    }, {
        key: '_fileOrDefaults',
        value: function _fileOrDefaults(type) {
            var _config = this.config,
                src = _config.src,
                dist = _config.dist;

            var yamlPath = _path2.default.join(cwd, src, type + '.yml');

            var spineList = [];
            var spineEntries = [];
            var tocEntries = [];

            try {
                if (_fsExtra2.default.existsSync(yamlPath)) {
                    spineList = _YamlAdaptor2.default.load(yamlPath) || [];
                    tocEntries = (0, _helpers.createPageModelsFromYAML)(spineList, src); // nested navigation
                    spineEntries = (0, _helpers.flattenNestedEntries)(tocEntries); // one-dimensional page flow
                } else {
                    throw new Error('[' + type + '.yml] not found. Creating default file.');
                }
            } catch (err) {
                if (/Creating default file/.test(err.message)) {
                    // log.info(err.message)
                    // createPagesMetaYaml(src, type)
                } else {
                    throw err;
                }
            }

            return {
                src: src,
                dist: dist + '-' + type,
                spineList: spineList,
                spineEntries: spineEntries,
                tocEntries: tocEntries
            };
        }

        /**
         * Add an entry to an Object or Array property of State
         * @param  {String} prop Property name
         * @param {*}       val Value to add
         * @return {*}
         */

    }, {
        key: 'add',
        value: function add(prop, val) {
            var _checkTypes2 = this._checkTypes(prop, val),
                _prop = _checkTypes2._prop,
                _val = _checkTypes2._val;

            if ((0, _lodash.isArray)(this[_prop])) {
                this[_prop] = [].concat((0, _toConsumableArray3.default)(this[_prop]), [_val]);
                return this[_prop];
            }

            if ((0, _lodash.isPlainObject)(this[_prop])) {
                this[_prop] = (0, _extends3.default)({}, this[_prop], { _val: _val });
                return this[_prop];
            }

            if (typeof this[_prop] === 'string') {
                this[_prop] = this[_prop] + String(val);
                return this[_prop];
            }

            throw new Error('Something went wrong in `State#add`');
        }

        /**
         * Remove an entry from an Object or Array
         * @param  {String} prop Property name
         * @param  {*}      val Value to remove
         * @return {*}
         */

    }, {
        key: 'remove',
        value: function remove(prop, val) {
            var _checkTypes3 = this._checkTypes(prop, val),
                _prop = _checkTypes3._prop,
                _val = _checkTypes3._val;

            if ((0, _lodash.isArray)(this[_prop])) {
                var index = void 0;
                try {
                    index = (0, _lodash.findIndex)(this[_prop], _val);
                    if (index < 0) {
                        throw new TypeError('The _property [' + val + '] could not be found in [' + this[prop] + ']');
                    }
                } catch (err) {
                    return err;
                }

                this[_prop].splice(index, 1);
                return this[_prop];
            }

            if ((0, _lodash.isPlainObject)(this[_prop])) {
                delete this[_prop][_val];
                return this[_prop];
            }

            throw new Error('Something went wrong in `State#remove`');
        }

        /**
         * Merge an Object into a property of State
         * @param  {String} prop State key
         * @param  {Object} val  Object to merge into `key`
         * @return {Object}      Merged object
         */

    }, {
        key: 'merge',
        value: function merge(prop, val) {
            var _checkTypes4 = this._checkTypes(prop, val),
                _prop = _checkTypes4._prop,
                _val = _checkTypes4._val;

            this[_prop] = (0, _extends3.default)({}, this[_prop], _val);
            return this[_prop];
        }

        /**
         * Update a property of State
         * Accepts nested objects up to one level
         * @param  {String} prop Property name
         * @param  {*} val  New value
         * @return {*}      Updated property
         * @example         state.update('config.baseurl', '/')
         */

    }, {
        key: 'update',
        value: function update(prop, val) {
            var _prop$split = prop.split('.'),
                _prop$split2 = (0, _slicedToArray3.default)(_prop$split, 2),
                key = _prop$split2[0],
                rest = _prop$split2[1];

            if ({}.hasOwnProperty.call(this, key)) {
                if (rest) {
                    this[key][rest] = val;
                } else {
                    this[key] = val;
                }
            }

            return this[key];
        }

        /**
         * [contains description]
         * @param  {String} collection  [description]
         * @param  {String} value       [description]
         * @return {Integer}
         */

    }, {
        key: 'contains',
        value: function contains(collection, value) {
            if (!(0, _lodash.isArray)(this[collection])) {
                throw new TypeError('[State#contains] must be called on an array');
            }
            return (0, _lodash.findIndex)(this[collection], value);
        }

        /**
         * Restore initial state of state
         * @return {Object} State
         */

    }, {
        key: 'loadInitialState',
        value: function loadInitialState() {
            this.guide = [];
            this.figures = [];
            this.video = [];
            this.audio = [];
            this.footnotes = [];
            this.build = 'epub';
            this.builds = {};
            this.cursor = [];
            this.metadata = [];
            this.spine = [];
            this.toc = [];
            this.remoteAssets = [];
            this.loi = [];
            this.theme = {};
            this.sequence = [];
            this.hash = _crypto2.default.randomBytes(20).toString('hex');
            this.config = {
                env: process.env.NODE_ENV || 'development',
                src: '_project',
                dist: 'project',
                ibooks_specified_fonts: false,
                theme: 'b-ber-theme-serif',
                themes_directory: './themes',
                baseurl: '/',
                autoprefixer_options: {
                    browsers: ['last 2 versions', '> 2%'],
                    flexbox: 'no-2009'
                }

                // for dynamically created templates. functions here are overwritten
                // during build. see b-ber-modifiers/inject#mapSourcesToDynamicPageTemplate
            };this.templates = {
                dynamicPageTmpl: dynamicPageTmpl,
                dynamicPageHead: dynamicPageHead,
                dynamicPageTail: dynamicPageTail
            };

            this.loadSettings();
            this.loadMetadata();
            this.loadTheme();
            this.loadAudioVideo();
            this.loadBuilds();
        }
    }, {
        key: 'reload',
        value: function reload() {
            this.guide = [];
            this.figures = [];
            this.footnotes = [];
            this.cursor = [];
            this.spine = [];
            this.toc = [];
            this.remoteAssets = [];
            this.loi = [];
            this.sequence = [];
            this.templates = { dynamicPageTmpl: dynamicPageTmpl, dynamicPageHead: dynamicPageHead, dynamicPageTail: dynamicPageTail };
            this.hash = _crypto2.default.randomBytes(20).toString('hex');
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.loadInitialState();
        }
    }, {
        key: 'loadSettings',
        value: function loadSettings() {
            var version = BBER_PACKAGE_JSON.version;

            this.version = version;

            if (_fsExtra2.default.existsSync(_path2.default.join(cwd, 'config.yml'))) {
                this.config = (0, _extends3.default)({}, this.config, _YamlAdaptor2.default.load(_path2.default.join(cwd, 'config.yml')));
            }
        }

        // depends on `config.src`

    }, {
        key: 'loadMetadata',
        value: function loadMetadata() {
            var fpath = _path2.default.join(cwd, this.config.src, 'metadata.yml');
            if (_fsExtra2.default.existsSync(fpath)) {
                this.metadata = [].concat((0, _toConsumableArray3.default)(this.metadata), (0, _toConsumableArray3.default)(_YamlAdaptor2.default.load(fpath)));
            }
        }
    }, {
        key: 'loadTheme',
        value: function loadTheme() {
            // just in case ...
            var themeError = new Error('There was an error loading theme [' + this.config.theme + ']');

            if ({}.hasOwnProperty.call(_bBerThemes2.default, this.config.theme)) {
                this.theme = _bBerThemes2.default[this.config.theme];
            } else {
                if (!{}.hasOwnProperty.call(this.config, 'themes_directory')) {
                    if (!_yargs2.default.argv._[0] || _yargs2.default.argv._[0] !== 'theme') {
                        // user is trying to run a command without defining a theme, so bail
                        _bBerLogger2.default.error('There was an error loading the theme, make sure you\'ve added a [themes_directory] to the [config.yml] if you\'re using a custom theme.');
                    } else {
                        // user is trying to run a `theme` command, either to set
                        // or list the available themes.  we don't need the
                        // `theme` config object for this operation, so continue
                        // execution
                        this.theme = {};
                        return;
                    }
                }

                // possibly a user defined theme, test if it exists
                try {
                    var userThemesPath = _path2.default.resolve(cwd, this.config.themes_directory);
                    var userThemes = _fsExtra2.default.readdirSync(userThemesPath).reduce(function (acc, curr) {
                        if (!_fsExtra2.default.lstatSync(_path2.default.resolve(userThemesPath, curr)).isDirectory()) return acc;
                        var userModule = _fsExtra2.default.existsSync(_path2.default.resolve(userThemesPath, curr, 'package.json')) ? require(_path2.default.resolve(userThemesPath, curr)) : require(_path2.default.resolve(userThemesPath, curr, 'index.js'));
                        return acc.concat(userModule);
                    }, []);

                    var userTheme = (0, _lodash.find)(userThemes, { name: this.config.theme });
                    if (!userTheme) {
                        _bBerLogger2.default.error('Could not find theme [' + this.config.theme + ']');
                    }

                    // exists! set it

                    this.theme = userTheme;
                    return;
                } catch (err) {
                    _bBerLogger2.default.error(themeError);
                }
            }
        }
    }, {
        key: 'loadAudioVideo',
        value: function loadAudioVideo() {
            var mediaPath = _path2.default.join(cwd, this.config.src, '_media');
            try {
                if (_fsExtra2.default.existsSync(mediaPath)) {
                    var media = _fsExtra2.default.readdirSync(mediaPath);
                    var video = media.filter(function (a) {
                        return (/^video/.test(_mimeTypes2.default.lookup(a))
                        );
                    });
                    var audio = media.filter(function (a) {
                        return (/^audio/.test(_mimeTypes2.default.lookup(a))
                        );
                    });

                    this.video = video;
                    this.audio = audio;
                }
            } catch (err) {
                throw new Error(err);
            }
        }
    }, {
        key: 'loadBuilds',
        value: function loadBuilds() {
            this.builds = {
                sample: this._fileOrDefaults('sample'),
                epub: this._fileOrDefaults('epub'),
                mobi: this._fileOrDefaults('mobi'),
                pdf: this._fileOrDefaults('pdf'),
                web: this._fileOrDefaults('web')
            };
        }
    }, {
        key: 'src',
        get: function get() {
            return this.config.src;
        },
        set: function set(val) {
            this.config.src = val;
        }
    }, {
        key: 'dist',
        get: function get() {
            return this.config.dist;
        },
        set: function set(val) {
            this.config.dist = val;
        }
    }, {
        key: 'theme',
        get: function get() {
            return this.config.theme;
        },
        set: function set(val) {
            this.config.theme = val;
        }
    }, {
        key: 'env',
        get: function get() {
            return process.env.NODE_ENV || 'development';
        },
        set: function set(val) {
            this.config.env = val;
        }
    }]);
    return State;
}();

var state = new State();
exports.default = state;
>>>>>>> 832bbc7... Restructuring
