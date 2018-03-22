<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*

API to transform YAML to/from JSON and JavaScript objects. Includes convenience
wrappers for loading local files. Uses
[`js-yaml`](https://www.npmjs.com/package/js-yaml), defaulting always to
safe-mode. Doesn't perform any error checking for I/O, assumes that its being
given valid paths. All methods are currently synchronous.

*/

var YamlAdaptor = function () {
    function YamlAdaptor() {
        (0, _classCallCheck3.default)(this, YamlAdaptor);
    }

    (0, _createClass3.default)(YamlAdaptor, null, [{
        key: 'read',
        value: function read(fpath) {
            var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';

            return _fsExtra2.default.readFileSync(fpath, encoding);
        }

        // @param {String} strOrObj  A string (JSON) or plain JS Object

    }, {
        key: 'toYaml',
        value: function toYaml(strOrObj) {
            if (typeof strOrObj === 'string') {
                return _jsYaml2.default.safeDump(strOrObj);
            }
            if (_lodash.isPlainObject) {
                return _jsYaml2.default.safeDump((0, _stringify2.default)(strOrObj));
            }

            throw new TypeError('Invalid type: [' + (typeof strOrObj === 'undefined' ? 'undefined' : (0, _typeof3.default)(strOrObj)) + ']');
        }

        // Loads YAML from file contents
        // @param {String} fpath   File path
        // @return {Object}

    }, {
        key: 'load',
        value: function load(fpath) {
            return _jsYaml2.default.safeLoad(YamlAdaptor.read(fpath));
        }

        // @param str         JavaScript Object
        // @return {String}   YAML formatted string

    }, {
        key: 'dump',
        value: function dump(str) {
            return _jsYaml2.default.safeDump(str, { indent: 2 });
        }

        // Alias for js-yaml package's `#safeLoad`.
        // @params str  YAML string

    }, {
        key: 'parse',
        value: function parse(str) {
            return _jsYaml2.default.safeLoad(str);
        }
    }]);
    return YamlAdaptor;
}();

exports.default = YamlAdaptor;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*

API to transform YAML to/from JSON and JavaScript objects. Includes convenience
wrappers for loading local files. Uses
[`js-yaml`](https://www.npmjs.com/package/js-yaml), defaulting always to
safe-mode. Doesn't perform any error checking for I/O, assumes that its being
given valid paths. All methods are currently synchronous.

*/

var YamlAdaptor = function () {
    function YamlAdaptor() {
        (0, _classCallCheck3.default)(this, YamlAdaptor);
    }

    (0, _createClass3.default)(YamlAdaptor, null, [{
        key: 'read',
        value: function read(fpath) {
            var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';

            return _fsExtra2.default.readFileSync(fpath, encoding);
        }

        // @param {String} strOrObj  A string (JSON) or plain JS Object

    }, {
        key: 'toYaml',
        value: function toYaml(strOrObj) {
            if (typeof strOrObj === 'string') {
                return _jsYaml2.default.safeDump(strOrObj);
            }
            if (_lodash.isPlainObject) {
                return _jsYaml2.default.safeDump((0, _stringify2.default)(strOrObj));
            }

            throw new TypeError('Invalid type: [' + (typeof strOrObj === 'undefined' ? 'undefined' : (0, _typeof3.default)(strOrObj)) + ']');
        }

        // Loads YAML from file contents
        // @param {String} fpath   File path
        // @return {Object}

    }, {
        key: 'load',
        value: function load(fpath) {
            return _jsYaml2.default.safeLoad(YamlAdaptor.read(fpath));
        }

        // @param str         JavaScript Object
        // @return {String}   YAML formatted string

    }, {
        key: 'dump',
        value: function dump(str) {
            return _jsYaml2.default.safeDump(str, { indent: 2 });
        }

        // Alias for js-yaml package's `#safeLoad`.
        // @params str  YAML string

    }, {
        key: 'parse',
        value: function parse(str) {
            return _jsYaml2.default.safeLoad(str);
        }
    }]);
    return YamlAdaptor;
}();

<<<<<<< HEAD
exports.default = Yaml;
>>>>>>> 832bbc7... Restructuring
||||||| parent of 3c03362... Refactoring; Builds
exports.default = Yaml;
=======
exports.default = YamlAdaptor;
>>>>>>> 3c03362... Refactoring; Builds
