<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createPagesMetaYaml = exports.flattenNestedEntries = exports.createPageModelsFromYAML = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createPageModelsFromYAML = function createPageModelsFromYAML(arr, src) {
    var _root = [{ nodes: [] }];
    var munge = function munge(_arr, _result) {
        _arr.forEach(function (a) {
            // preface our function with a guard that assigns the accumulator to
            // `_root` if it lacks a `nodes` property
            var index = void 0;
            var nodes = void 0;

            if ((0, _lodash.isArray)(_result) && _result.length - 1 > -1) {
                index = _result.length - 1;
            } else {
                index = 0;
            }

            if (!_result[index] || !{}.hasOwnProperty.call(_result[index], 'nodes')) {
                nodes = _root[0].nodes;
            } else {
                nodes = _result[index].nodes;
            }

            if ((0, _lodash.isPlainObject)(a)) {
                if ((0, _keys2.default)(a)[0] === 'section') {
                    // nested section
                    munge(a[(0, _keys2.default)(a)[0]], nodes);
                } else {
                    // entry with attributes
                    var data = (0, _utils.modelFromObject)(a, src);
                    nodes.push(data);
                }
            } else {
                // string entry
                var _data = (0, _utils.modelFromString)(a, src);
                nodes.push(_data);
            }
        });
    };
    munge(arr, _root);
    return _root[0].nodes;
};

var flattenNestedEntries = function flattenNestedEntries(arr) {
    var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    arr.forEach(function (a) {
        if ((0, _lodash.isPlainObject)(a)) {
            // in an entry
            result.push(a);
            if (a.nodes && a.nodes.length) {
                flattenNestedEntries(a.nodes, result);
            }
        } else {
            throw new Error('[state#flattenNestedEntries] requires an array of Objects, [' + (typeof _ === 'undefined' ? 'undefined' : (0, _typeof3.default)(_)) + '] provided'); // eslint-disable-line max-len
        }
    });

    return result;
};

var createPagesMetaYaml = function createPagesMetaYaml(src, type) {
    var arr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    return _fsExtra2.default.mkdirp(_path2.default.join(process.cwd(), src), function (err0) {
        if (err0) throw err0;
        var content = arr.reduce(function (acc, curr) {
            return acc.concat('- ' + curr.fileName);
        }, '');
        _fsExtra2.default.writeFile(_path2.default.join(src, type + '.yml'), content, function (err1) {
            if (err1) throw err1;
        });
    });
};

exports.createPageModelsFromYAML = createPageModelsFromYAML;
exports.flattenNestedEntries = flattenNestedEntries;
exports.createPagesMetaYaml = createPagesMetaYaml;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createPagesMetaYaml = exports.flattenNestedEntries = exports.createPageModelsFromYAML = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createPageModelsFromYAML = function createPageModelsFromYAML(arr, src) {
    var _root = [{ nodes: [] }];
    var munge = function munge(_arr, _result) {
        _arr.forEach(function (a) {
            // preface our function with a guard that assigns the accumulator to
            // `_root` if it lacks a `nodes` property
            var index = void 0;
            var nodes = void 0;

            if ((0, _lodash.isArray)(_result) && _result.length - 1 > -1) {
                index = _result.length - 1;
            } else {
                index = 0;
            }

            if (!_result[index] || !{}.hasOwnProperty.call(_result[index], 'nodes')) {
                nodes = _root[0].nodes;
            } else {
                nodes = _result[index].nodes;
            }

            if ((0, _lodash.isPlainObject)(a)) {
                if ((0, _keys2.default)(a)[0] === 'section') {
                    // nested section
                    munge(a[(0, _keys2.default)(a)[0]], nodes);
                } else {
                    // entry with attributes
                    var data = (0, _utils.modelFromObject)(a, src);
                    nodes.push(data);
                }
            } else {
                // string entry
                var _data = (0, _utils.modelFromString)(a, src);
                nodes.push(_data);
            }
        });
    };
    munge(arr, _root);
    return _root[0].nodes;
};

var flattenNestedEntries = function flattenNestedEntries(arr) {
    var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    arr.forEach(function (a) {
        if ((0, _lodash.isPlainObject)(a)) {
            // in an entry
            result.push(a);
            if (a.nodes && a.nodes.length) {
                flattenNestedEntries(a.nodes, result);
            }
        } else {
            throw new Error('[state#flattenNestedEntries] requires an array of Objects, [' + (typeof _ === 'undefined' ? 'undefined' : (0, _typeof3.default)(_)) + '] provided'); // eslint-disable-line max-len
        }
    });

    return result;
};

var createPagesMetaYaml = function createPagesMetaYaml(src, type) {
    var arr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    return _fsExtra2.default.mkdirp(_path2.default.join(process.cwd(), src), function (err0) {
        if (err0) throw err0;
        var content = arr.reduce(function (acc, curr) {
            return acc.concat('- ' + curr.fileName);
        }, '');
        _fsExtra2.default.writeFile(_path2.default.join(src, type + '.yml'), content, function (err1) {
            if (err1) throw err1;
        });
    });
};

exports.createPageModelsFromYAML = createPageModelsFromYAML;
exports.flattenNestedEntries = flattenNestedEntries;
exports.createPagesMetaYaml = createPagesMetaYaml;
>>>>>>> 832bbc7... Restructuring
