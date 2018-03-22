'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _bBerThemes = require('@canopycanopycanopy/b-ber-themes');

var _bBerThemes2 = _interopRequireDefault(_bBerThemes);

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

var _YamlAdaptor = require('./YamlAdaptor');

var _YamlAdaptor2 = _interopRequireDefault(_YamlAdaptor);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cwd = process.cwd();

var ApplicationLoader = function () {
    function ApplicationLoader() {
        var _this = this;

        (0, _classCallCheck3.default)(this, ApplicationLoader);

        this.__MODULE_PATH__ = _path2.default.dirname(_path2.default.dirname(__dirname));
        this.__PACKAGE_JSON__ = require(_path2.default.join(this.__MODULE_PATH__, 'package.json')); // eslint-disable-line import/no-dynamic-require,global-require

        (0, _entries2.default)(ApplicationLoader.defaults).forEach(function (_ref) {
            var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
                key = _ref2[0],
                val = _ref2[1];

            return _this[key] = val;
        });
    }

    (0, _createClass3.default)(ApplicationLoader, [{
        key: '__version',
        value: function __version() {
            var version = this.__PACKAGE_JSON__.version;

            this.version = version;
        }
    }, {
        key: '__config',
        value: function __config() {
            if (!_fsExtra2.default.existsSync(_path2.default.join(cwd, 'config.yml'))) return;
            this.config = (0, _extends3.default)({}, this.config, _YamlAdaptor2.default.load(_path2.default.join(cwd, 'config.yml')));
        }
    }, {
        key: '__metadata',
        value: function __metadata() {
            var fpath = _path2.default.join(cwd, this.config.src, 'metadata.yml');
            if (!_fsExtra2.default.existsSync(fpath)) return;
            this.metadata = [].concat((0, _toConsumableArray3.default)(this.metadata), (0, _toConsumableArray3.default)(_YamlAdaptor2.default.load(fpath)));
        }
    }, {
        key: '__theme',
        value: function __theme() {
            var themeError = new Error('There was an error loading theme [' + this.theme + ']');

            if ({}.hasOwnProperty.call(_bBerThemes2.default, this.theme)) {
                this.theme = _bBerThemes2.default[this.theme];
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
                        var userModule = _fsExtra2.default.existsSync(_path2.default.resolve(userThemesPath, curr, 'package.json')) ? require(_path2.default.resolve(userThemesPath, curr)) // eslint-disable-line import/no-dynamic-require,global-require
                        : require(_path2.default.resolve(userThemesPath, curr, 'index.js')); // eslint-disable-line import/no-dynamic-require,global-require
                        return acc.concat(userModule);
                    }, []);

                    var userTheme = (0, _find2.default)(userThemes, { name: this.config.theme });
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
        key: '__media',
        value: function __media() {
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
        key: '__builds',
        value: function __builds() {
            this.buildTypes = {
                sample: this.__loadFromFileOrDefaultSettings('sample'),
                epub: this.__loadFromFileOrDefaultSettings('epub'),
                mobi: this.__loadFromFileOrDefaultSettings('mobi'),
                pdf: this.__loadFromFileOrDefaultSettings('pdf'),
                web: this.__loadFromFileOrDefaultSettings('web'),
                reader: this.__loadFromFileOrDefaultSettings('reader')
            };
        }
    }, {
        key: '__loadFromFileOrDefaultSettings',
        value: function __loadFromFileOrDefaultSettings(type) {
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
    }, {
        key: 'load',
        value: function load() {
            this.__version();
            this.__config();
            this.__metadata();
            this.__theme();
            this.__media();
            this.__builds();
        }
    }]);
    return ApplicationLoader;
}();

ApplicationLoader.defaults = {
    version: '',
    config: {
        env: process.env.NODE_ENV || 'development',
        src: '_project',
        dist: 'project',
        ibooks_specified_fonts: false,
        theme: 'b-ber-theme-serif',
        themes_directory: './themes',
        baseurl: '/',
        remote_url: '/',
        autoprefixer_options: {
            browsers: ['last 2 versions', '> 2%'],
            flexbox: 'no-2009'
        }
    },

    metadata: [],
    video: [],
    audio: [],
    buildTypes: { sample: {}, epub: {}, mobi: {}, pdf: {}, web: {} }
};
exports.default = ApplicationLoader;