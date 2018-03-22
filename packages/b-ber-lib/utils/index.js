<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.trimSlashes = exports.encodeQueryString = exports.ensureDecoded = exports.getTitleOrName = exports.parseHTMLFiles = exports.getPagebreakAttribute = exports.flattenSpineFromYAML = exports.nestedContentToYAML = exports.modelFromString = exports.modelFromObject = exports.spineModel = exports.escapeHTML = exports.passThrough = exports.htmlComment = exports.promiseAll = exports.forOf = exports.getImageOrientation = exports.hrtimeformat = exports.fileId = exports.opsPath = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import state from '../State'

/**
 * @module utils
 */

var cwd = process.cwd();

/**
 * Get a file's relative path to the OPS
 * @param  {String} fpath File path
 * @param  {String} base  Project's base path
 * @return {String}
 */
var opsPath = function opsPath(fpath, base) {
    return fpath.replace(new RegExp('^' + base + _path2.default.sep + 'OPS' + _path2.default.sep + '?'), '');
};

/**
 * [description]
 * @param  {String} str [description]
 * @return {String}
 */

// https://www.w3.org/TR/xml-names/#Conformance
var fileId = function fileId(str) {
    return '_' + str.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 * [description]
 * @param  {Array} a [description]
 * @return {String}
 */
var hrtimeformat = function hrtimeformat(a) {
    var s = a[0] * 1000 + a[1] / 1000000;
    return String(s).slice(0, -3) + 'ms';
};

/**
 * Determine an image's orientation
 * @param  {Number} w Image width
 * @param  {Number} h Image Height
 * @return {String}
 */
var getImageOrientation = function getImageOrientation(w, h) {
    // assign image class based on w:h ratio
    var widthToHeight = w / h;
    var imageType = null;

    if (widthToHeight < 0.61) imageType = 'portrait-high';
    if (widthToHeight >= 0.61 && widthToHeight < 1) imageType = 'portrait';
    if (widthToHeight === 1) imageType = 'square';
    if (widthToHeight > 1) imageType = 'landscape';
    return imageType;
};

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} collection   [description]
 * @param {Object} iterator     [description]
 * @return {*}
 */
var forOf = function forOf(collection, iterator) {
    return (0, _entries2.default)(collection).forEach(function (_ref) {
        var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
            key = _ref2[0],
            val = _ref2[1];

        return iterator(key, val);
    });
};

/**
 * [description]
 * @return {String}
 */
// const src = () => {
//     if (!state.buildTypes[state.build] || !state.buildTypes[state.build].src) {
//         state.update('build', 'epub')
//     }
//     return path.join(cwd, state.buildTypes[state.build].src)
// }

/**
 * [description]
 * @return {String}
 */

// const dist = () => {
//     if (!state.buildTypes[state.build] || !state.buildTypes[state.build].dist) {
//         state.update('build', 'epub')
//     }
//     return path.join(cwd, state.buildTypes[state.build].dist)
// }

// const build = () => state.build

// const env = () => state.config.env

// const version = () => state.version

// const theme = () =>  state.theme

// const metadata = () => state.metadata

/**
 * [description]
 * @param  {Array<Object<Promise>>} promiseArray [description]
 * @return {Object<Promise|Error>}
 */
var promiseAll = function promiseAll(promiseArray) {
    return new _promise2.default(function (resolve) {
        return _promise2.default.all(promiseArray).then(resolve);
    });
};

var htmlComment = function htmlComment(str) {
    return '\n<!-- ' + str + ' -->\n';
};

var passThrough = function passThrough(args) {
    return args;
};

var escapeHTML = function escapeHTML(str) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
};

// for generating page models used in navigation
var spineModel = function spineModel() {
    return {
        relativePath: '',
        absolutePath: '',
        extension: '',
        fileName: '',
        name: '',
        // baseName: '',
        remotePath: '',
        type: '',
        title: '',
        // pageOrder: -1,
        linear: true,
        in_toc: true,
        nodes: []
    };
};

/**
 * [description]
 * @param {String} _str   File basename with extension
 * @param {String} _src   Current `src` directory name
 * @return {Object}
 */
var modelFromString = function modelFromString(_str, _src) {
    var str = String(_str);
    var pathFragment = /^(toc\.x?html|nav\.ncx)$/i.test(str) ? '' : 'text'; // TODO: clean this up
    var relativePath = _path2.default.join(pathFragment, str); // relative to OPS
    var absolutePath = _path2.default.join(cwd, _src, relativePath);
    var extension = _path2.default.extname(absolutePath);
    var fileName = _path2.default.basename(absolutePath);
    var name = _path2.default.basename(absolutePath, extension);

    // const baseName = path.basename(absolutePath, extension)
    var remotePath = ''; // TODO: add remote URL where applicable
    return (0, _extends3.default)({}, spineModel(), {
        relativePath: relativePath,
        absolutePath: absolutePath,
        extension: extension,
        fileName: fileName,
        name: name,
        remotePath: remotePath
    });
};

var modelFromObject = function modelFromObject(_obj, _src) {
    var _obj$Object$keys$ = _obj[(0, _keys2.default)(_obj)[0]],
        in_toc = _obj$Object$keys$.in_toc,
        linear = _obj$Object$keys$.linear;

    var str = (0, _keys2.default)(_obj)[0];
    var model = modelFromString(str, _src);

    return (0, _extends3.default)({}, model, { in_toc: in_toc, linear: linear });
};

var nestedContentToYAML = function nestedContentToYAML(arr) {
    var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    arr.forEach(function (_) {
        var model = {};

        // TODO: check for custom attrs somewhere else.
        if (_.linear === false || _.in_toc === false) {
            if (_.in_toc === false) model.in_toc = false;
            if (_.linear === false) model.linear = false;
            result.push((0, _defineProperty3.default)({}, _.fileName, model));
        } else {
            result.push(_.fileName);
            if (_.nodes && _.nodes.length) {
                model.section = [];
                result.push(model);
                nestedContentToYAML(_.nodes, model.section);
            }
        }
    });

    return result;
};

var flattenSpineFromYAML = function flattenSpineFromYAML(arr) {
    return arr.reduce(function (acc, curr) {
        if ((0, _lodash.isPlainObject)(curr)) {
            if ((0, _keys2.default)(curr)[0] === 'section') {
                return acc.concat(flattenSpineFromYAML(curr.section));
            }
            return acc.concat((0, _keys2.default)(curr)[0]);
        }
        return acc.concat(curr);
    }, []);
};

function getPagebreakAttribute(_ref3) {
    var pagebreak = _ref3.pagebreak;

    if (!pagebreak || typeof pagebreak !== 'string') return '';
    switch (pagebreak) {
        case 'before':
        case 'after':
            return ' style="page-break-' + pagebreak + ':always;"';
        case 'both':
            return ' style="page-break-before:always; page-break-after:always;"';
        default:
            return '';
    }
}

// used by xml and pdf tasks
// @param files     Array           List of `fileName` properties from the state.manifest object
// @param parser    Object          Instance of the Parser/Printer class
// @param dist      String          Absolute project path
// @return          Promise|Error   Promise (An XML string)
function parseHTMLFiles(files, parser, dist) {
    return new _promise2.default(function (resolve) {
        var dirname = _path2.default.join(dist, 'OPS', 'text');
        var text = files.map(function (_, index, arr) {
            var data = void 0;

            var fname = (0, _lodash.isPlainObject)(_) ? (0, _keys2.default)(_)[0] : typeof _ === 'string' ? _ : null;
            var ext = '.xhtml';

            if (!fname) return null;

            var fpath = _path2.default.join(dirname, '' + fname + ext);

            try {
                if (!_fsExtra2.default.existsSync(fpath)) return null;
                data = _fsExtra2.default.readFileSync(fpath, 'utf8');
            } catch (err) {
                return _bBerLogger2.default.warn(err.message);
            }

            return parser.parse(data, index, arr);
        }).filter(Boolean);

        _promise2.default.all(text).catch(function (err) {
            return _bBerLogger2.default.error(err);
        }).then(function (docs) {
            return resolve(docs.join('\n'));
        });
    });
}

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attache in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
//
// this is provisional, will just cause more confusion in the future
var getTitleOrName = function getTitleOrName(page) {
    if (page.name === 'figures-titlepage') {
        return 'Figures';
    }

    return page.title || page.name;
};

var ensureDecoded = function ensureDecoded(str) {
    var str_ = str;
    while (decodeURIComponent(str_) !== str_) {
        str_ = decodeURIComponent(str_);
    }return str_;
};

var encodeQueryString = function encodeQueryString(url) {
    var url_ = url.split('?');
    var loc = url_[0];
    var qs = url_[1];

    if (!qs) return loc;

    qs = ensureDecoded(qs);
    qs = encodeURIComponent(qs);
    url_ = loc + '?' + qs;
    return url_;
};

var trimSlashes = function trimSlashes(url) {
    return url.replace(/(^\/+|\/+$)/, '');
};

exports.opsPath = opsPath;
exports.fileId = fileId;
exports.hrtimeformat = hrtimeformat;
exports.getImageOrientation = getImageOrientation;
exports.forOf = forOf;
exports.promiseAll = promiseAll;
exports.htmlComment = htmlComment;
exports.passThrough = passThrough;
exports.escapeHTML = escapeHTML;
exports.spineModel = spineModel;
exports.modelFromObject = modelFromObject;
exports.modelFromString = modelFromString;
exports.nestedContentToYAML = nestedContentToYAML;
exports.flattenSpineFromYAML = flattenSpineFromYAML;
exports.getPagebreakAttribute = getPagebreakAttribute;
exports.parseHTMLFiles = parseHTMLFiles;
exports.getTitleOrName = getTitleOrName;
exports.ensureDecoded = ensureDecoded;
exports.encodeQueryString = encodeQueryString;
exports.trimSlashes = trimSlashes;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.encodeQueryString = exports.ensureDecoded = exports.getTitleOrName = exports.parseHTMLFiles = exports.getPagebreakAttribute = exports.flattenSpineFromYAML = exports.nestedContentToYAML = exports.modelFromString = exports.modelFromObject = exports.spineModel = exports.escapeHTML = exports.passThrough = exports.htmlComment = exports.promiseAll = exports.forOf = exports.getImageOrientation = exports.hrtimeformat = exports.fileId = exports.opsPath = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import state from '../State'

/**
 * @module utils
 */

var cwd = process.cwd();

/**
 * Get a file's relative path to the OPS
 * @param  {String} fpath File path
 * @param  {String} base  Project's base path
 * @return {String}
 */
var opsPath = function opsPath(fpath, base) {
    return fpath.replace(new RegExp('^' + base + _path2.default.sep + 'OPS' + _path2.default.sep + '?'), '');
};

/**
 * [description]
 * @param  {String} str [description]
 * @return {String}
 */

// https://www.w3.org/TR/xml-names/#Conformance
var fileId = function fileId(str) {
    return '_' + str.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 * [description]
 * @param  {Array} a [description]
 * @return {String}
 */
var hrtimeformat = function hrtimeformat(a) {
    var s = a[0] * 1000 + a[1] / 1000000;
    return String(s).slice(0, -3) + 'ms';
};

/**
 * Determine an image's orientation
 * @param  {Number} w Image width
 * @param  {Number} h Image Height
 * @return {String}
 */
var getImageOrientation = function getImageOrientation(w, h) {
    // assign image class based on w:h ratio
    var widthToHeight = w / h;
    var imageType = null;

    if (widthToHeight < 0.61) imageType = 'portrait-high';
    if (widthToHeight >= 0.61 && widthToHeight < 1) imageType = 'portrait';
    if (widthToHeight === 1) imageType = 'square';
    if (widthToHeight > 1) imageType = 'landscape';
    return imageType;
};

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} collection   [description]
 * @param {Object} iterator     [description]
 * @return {*}
 */
var forOf = function forOf(collection, iterator) {
    return (0, _entries2.default)(collection).forEach(function (_ref) {
        var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
            key = _ref2[0],
            val = _ref2[1];

        return iterator(key, val);
    });
};

/**
 * [description]
 * @return {String}
 */
// const src = () => {
//     if (!state.builds[state.build] || !state.builds[state.build].src) {
//         state.update('build', 'epub')
//     }
//     return path.join(cwd, state.builds[state.build].src)
// }

/**
 * [description]
 * @return {String}
 */

// const dist = () => {
//     if (!state.builds[state.build] || !state.builds[state.build].dist) {
//         state.update('build', 'epub')
//     }
//     return path.join(cwd, state.builds[state.build].dist)
// }

// const build = () => state.build

// const env = () => state.config.env

// const version = () => state.version

// const theme = () =>  state.theme

// const metadata = () => state.metadata

/**
 * [description]
 * @param  {Array<Object<Promise>>} promiseArray [description]
 * @return {Object<Promise|Error>}
 */
var promiseAll = function promiseAll(promiseArray) {
    return new _promise2.default(function (resolve) {
        return _promise2.default.all(promiseArray).then(resolve);
    });
};

var htmlComment = function htmlComment(str) {
    return '\n<!-- ' + str + ' -->\n';
};

var passThrough = function passThrough(args) {
    return args;
};

var escapeHTML = function escapeHTML(str) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
};

// for generating page models used in navigation
var spineModel = function spineModel() {
    return {
        relativePath: '',
        absolutePath: '',
        extension: '',
        fileName: '',
        name: '',
        // baseName: '',
        remotePath: '',
        type: '',
        title: '',
        // pageOrder: -1,
        linear: true,
        in_toc: true,
        nodes: []
    };
};

/**
 * [description]
 * @param {String} _str   File basename with extension
 * @param {String} _src   Current `src` directory name
 * @return {Object}
 */
var modelFromString = function modelFromString(_str, _src) {
    var str = String(_str);
    var pathFragment = /^(toc\.x?html|nav\.ncx)$/i.test(str) ? '' : 'text'; // TODO: clean this up
    var relativePath = _path2.default.join(pathFragment, str); // relative to OPS
    var absolutePath = _path2.default.join(cwd, _src, relativePath);
    var extension = _path2.default.extname(absolutePath);
    var fileName = _path2.default.basename(absolutePath);
    var name = _path2.default.basename(absolutePath, extension);

    // const baseName = path.basename(absolutePath, extension)
    var remotePath = ''; // TODO: add remote URL where applicable
    return (0, _extends3.default)({}, spineModel(), {
        relativePath: relativePath,
        absolutePath: absolutePath,
        extension: extension,
        fileName: fileName,
        name: name,
        remotePath: remotePath
    });
};

var modelFromObject = function modelFromObject(_obj, _src) {
    var _obj$Object$keys$ = _obj[(0, _keys2.default)(_obj)[0]],
        in_toc = _obj$Object$keys$.in_toc,
        linear = _obj$Object$keys$.linear;

    var str = (0, _keys2.default)(_obj)[0];
    var model = modelFromString(str, _src);

    return (0, _extends3.default)({}, model, { in_toc: in_toc, linear: linear });
};

var nestedContentToYAML = function nestedContentToYAML(arr) {
    var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    arr.forEach(function (_) {
        var model = {};

        // TODO: check for custom attrs somewhere else.
        if (_.linear === false || _.in_toc === false) {
            if (_.in_toc === false) model.in_toc = false;
            if (_.linear === false) model.linear = false;
            result.push((0, _defineProperty3.default)({}, _.fileName, model));
        } else {
            result.push(_.fileName);
            if (_.nodes && _.nodes.length) {
                model.section = [];
                result.push(model);
                nestedContentToYAML(_.nodes, model.section);
            }
        }
    });

    return result;
};

var flattenSpineFromYAML = function flattenSpineFromYAML(arr) {
    return arr.reduce(function (acc, curr) {
        if ((0, _lodash.isPlainObject)(curr)) {
            if ((0, _keys2.default)(curr)[0] === 'section') {
                return acc.concat(flattenSpineFromYAML(curr.section));
            }
            return acc.concat((0, _keys2.default)(curr)[0]);
        }
        return acc.concat(curr);
    }, []);
};

function getPagebreakAttribute(_ref3) {
    var pagebreak = _ref3.pagebreak;

    if (!pagebreak || typeof pagebreak !== 'string') return '';
    switch (pagebreak) {
        case 'before':
        case 'after':
            return ' style="page-break-' + pagebreak + ':always;"';
        case 'both':
            return ' style="page-break-before:always; page-break-after:always;"';
        default:
            return '';
    }
}

// used by xml and pdf tasks
// @param files     Array           List of `fileName` properties from the state.manifest object
// @param parser    Object          Instance of the Parser/Printer class
// @param dist      String          Absolute project path
// @return          Promise|Error   Promise (An XML string)
function parseHTMLFiles(files, parser, dist) {
    return new _promise2.default(function (resolve) {
        var dirname = _path2.default.join(dist, 'OPS', 'text');
        var text = files.map(function (_, index, arr) {
            var data = void 0;

            var fname = (0, _lodash.isPlainObject)(_) ? (0, _keys2.default)(_)[0] : typeof _ === 'string' ? _ : null;
            var ext = '.xhtml';

            if (!fname) return null;

            var fpath = _path2.default.join(dirname, '' + fname + ext);

            try {
                if (!_fsExtra2.default.existsSync(fpath)) return null;
                data = _fsExtra2.default.readFileSync(fpath, 'utf8');
            } catch (err) {
                return _bBerLogger2.default.warn(err.message);
            }

            return parser.parse(data, index, arr);
        }).filter(Boolean);

        _promise2.default.all(text).catch(function (err) {
            return _bBerLogger2.default.error(err);
        }).then(function (docs) {
            return resolve(docs.join('\n'));
        });
    });
}

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attache in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
//
// this is provisional, will just cause more confusion in the future
var getTitleOrName = function getTitleOrName(page) {
    if (page.name === 'figures-titlepage') {
        return 'Figures';
    }

    return page.title || page.name;
};

var ensureDecoded = function ensureDecoded(str) {
    var str_ = str;
    while (decodeURIComponent(str_) !== str_) {
        str_ = decodeURIComponent(str_);
    }return str_;
};

var encodeQueryString = function encodeQueryString(url) {
    var url_ = url.split('?');
    var loc = url_[0];
    var qs = url_[1];

    if (!qs) return loc;

    qs = ensureDecoded(qs);
    qs = encodeURIComponent(qs);
    url_ = loc + '?' + qs;
    return url_;
};

exports.opsPath = opsPath;
exports.fileId = fileId;
exports.hrtimeformat = hrtimeformat;
exports.getImageOrientation = getImageOrientation;
exports.forOf = forOf;
exports.promiseAll = promiseAll;
exports.htmlComment = htmlComment;
exports.passThrough = passThrough;
exports.escapeHTML = escapeHTML;
exports.spineModel = spineModel;
exports.modelFromObject = modelFromObject;
exports.modelFromString = modelFromString;
exports.nestedContentToYAML = nestedContentToYAML;
exports.flattenSpineFromYAML = flattenSpineFromYAML;
exports.getPagebreakAttribute = getPagebreakAttribute;
exports.parseHTMLFiles = parseHTMLFiles;
exports.getTitleOrName = getTitleOrName;
exports.ensureDecoded = ensureDecoded;
exports.encodeQueryString = encodeQueryString;
>>>>>>> 832bbc7... Restructuring
