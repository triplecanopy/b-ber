<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _dc = require('@canopycanopycanopy/b-ber-shapes/dc');

var _State = require('./State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mehtods to detect XML media-type properties based on the content of XHTML documents
 * @namespace
 */
var ManifestItemProperties = function () {
    function ManifestItemProperties() {
        (0, _classCallCheck3.default)(this, ManifestItemProperties);
    }

    (0, _createClass3.default)(ManifestItemProperties, null, [{
        key: 'isHTML',

        /**
         * Detect if a file is an (X)HTML document
         * @param  {String}  file File path
         * @return {Boolean}
         */
        value: function isHTML(file) {
            return Boolean(_mimeTypes2.default.lookup(file.absolutePath) === 'text/html' || _mimeTypes2.default.lookup(file.absolutePath) === 'application/xhtml+xml');
        }

        /**
         * Detect if a file is an ePub navigation document
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isNav',
        value: function isNav(file) {
            return Boolean((_mimeTypes2.default.lookup(file.absolutePath) === 'text/html' || _mimeTypes2.default.lookup(file.absolutePath) === 'application/xhtml+xml') && /^toc\./.test(file.name));
        }

        /**
         * Detect if an XHTML file contains JavaScript
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isScripted',
        value: function isScripted(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;

            // TODO: fixme; we need to check if the toc.xhtml is scripted, but it
            // hasn't been written to disk yet.  checking right now against the
            // results from `state.template.dynamicTail` for now, since we know
            // that the toc was written using that
            if (ManifestItemProperties.isNav(file)) {
                // the dynamicTail function in state throws an error initially,
                // though, as the function is assigned during the inject task, so
                // make sure to handle that
                var tail = '';
                try {
                    tail = _State2.default.templates.dynamicPageTail();
                } catch (err) {
                    if (/state.templates#dynamicPageTail/.test(err)) return false;
                    throw err;
                }

                return tail.match(/<script/);
            }

            var contents = _fsExtra2.default.readFileSync(file.absolutePath, 'utf8');
            return Boolean(contents.match(/<script/));
        }

        /**
         * Detect if an XHTML file contains SVG
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isSVG',
        value: function isSVG(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;
            var contents = _fsExtra2.default.readFileSync(file.absolutePath, 'utf8');
            return Boolean(contents.match(/<svg/));
        }

        /**
         * Detect if a term is a Dublin Core `element`
         * @param  {Object}  data [description]
         * @return {Boolean}
         */

    }, {
        key: 'isDCElement',
        value: function isDCElement(data) {
            return Boolean({}.hasOwnProperty.call(data, 'term') && _dc.elements.indexOf(data.term) > -1);
        }

        /**
         * Detect if a term is a Dublin Core `term`
         * @param  {Object<String>}  data [description]
         * @return {Boolean}
         */

    }, {
        key: 'isDCTerm',
        value: function isDCTerm(data) {
            return Boolean({}.hasOwnProperty.call(data, 'term') && _dc.terms.indexOf(data.term) > -1);
        }

        /**
         * Detect if an XHTML file contains remote resources
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'hasRemoteResources',
        value: function hasRemoteResources(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;
            var fpath = file.absolutePath;
            var contents = _fsExtra2.default.readFileSync(fpath, 'utf8');
            return Boolean(contents.match(/src=(?:['"]{1})?https?/));
        }

        /**
         * Test if an XHTML file is a navigation document, contains JavaScript or
         * SVG
         * @param  {String} file  File path
         * @return {Array}        An array of dublin core media-type properties
         */

    }, {
        key: 'testHTML',
        value: function testHTML(file) {
            var props = [];
            if (ManifestItemProperties.isNav(file)) props.push('nav');
            if (ManifestItemProperties.isScripted(file)) props.push('scripted');
            if (ManifestItemProperties.isSVG(file)) props.push('svg');
            if (ManifestItemProperties.hasRemoteResources(file)) props.push('remote-resources');
            return props;
        }

        /**
         * Test if an object contains Dublin Core `term`s or `element`s
         * @param  {Object} data [description]
         * @return {Object<Boolean>}
         */

    }, {
        key: 'testMeta',
        value: function testMeta(data) {
            return {
                term: ManifestItemProperties.isDCTerm(data),
                element: ManifestItemProperties.isDCElement(data)
            };
        }
    }]);
    return ManifestItemProperties;
}();

exports.default = ManifestItemProperties;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _dc = require('@canopycanopycanopy/b-ber-shapes/dc');

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mehtods to detect XML media-type properties based on the content of XHTML documents
 * @namespace
 */
var ManifestItemProperties = function () {
    function ManifestItemProperties() {
        (0, _classCallCheck3.default)(this, ManifestItemProperties);
    }

    (0, _createClass3.default)(ManifestItemProperties, null, [{
        key: 'isHTML',

        /**
         * Detect if a file is an (X)HTML document
         * @param  {String}  file File path
         * @return {Boolean}
         */
        value: function isHTML(file) {
            return Boolean(_mimeTypes2.default.lookup(file.absolutePath) === 'text/html' || _mimeTypes2.default.lookup(file.absolutePath) === 'application/xhtml+xml');
        }

        /**
         * Detect if a file is an ePub navigation document
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isNav',
        value: function isNav(file) {
            return Boolean((_mimeTypes2.default.lookup(file.absolutePath) === 'text/html' || _mimeTypes2.default.lookup(file.absolutePath) === 'application/xhtml+xml') && /^toc\./.test(file.name));
        }

        /**
         * Detect if an XHTML file contains JavaScript
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isScripted',
        value: function isScripted(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;

            // TODO: fixme; we need to check if the toc.xhtml is scripted, but it
            // hasn't been written to disk yet.  checking right now against the
            // results from `state.template.dynamicTail` for now, since we know
            // that the toc was written using that
            if (ManifestItemProperties.isNav(file)) {
                // the dynamicTail function in state throws an error initially,
                // though, as the function is assigned during the inject task, so
                // make sure to handle that
                var tail = '';
                try {
                    tail = _.state.templates.dynamicPageTail();
                } catch (err) {
                    if (/state.templates#dynamicPageTail/.test(err)) return false;
                    throw err;
                }

                return tail.match(/<script/);
            }

            var fpath = file.absolutePath;
            var contents = _fsExtra2.default.readFileSync(fpath, 'utf8');
            return Boolean(contents.match(/<script/));
        }

        /**
         * Detect if an XHTML file contains SVG
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'isSVG',
        value: function isSVG(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;
            var fpath = file.absolutePath;
            var contents = _fsExtra2.default.readFileSync(fpath, 'utf8');
            return Boolean(contents.match(/<svg/));
        }

        /**
         * Detect if a term is a Dublin Core `element`
         * @param  {Object}  data [description]
         * @return {Boolean}
         */

    }, {
        key: 'isDCElement',
        value: function isDCElement(data) {
            return Boolean({}.hasOwnProperty.call(data, 'term') && _dc.elements.indexOf(data.term) > -1);
        }

        /**
         * Detect if a term is a Dublin Core `term`
         * @param  {Object<String>}  data [description]
         * @return {Boolean}
         */

    }, {
        key: 'isDCTerm',
        value: function isDCTerm(data) {
            return Boolean({}.hasOwnProperty.call(data, 'term') && _dc.terms.indexOf(data.term) > -1);
        }

        /**
         * Detect if an XHTML file contains remote resources
         * @param  {String}  file File path
         * @return {Boolean}
         */

    }, {
        key: 'hasRemoteResources',
        value: function hasRemoteResources(file) {
            if (!ManifestItemProperties.isHTML(file)) return false;
            var fpath = file.absolutePath;
            var contents = _fsExtra2.default.readFileSync(fpath, 'utf8');
            return Boolean(contents.match(/src=(?:['"]{1})?https?/));
        }

        /**
         * Test if an XHTML file is a navigation document, contains JavaScript or
         * SVG
         * @param  {String} file  File path
         * @return {Array}        An array of dublin core media-type properties
         */

    }, {
        key: 'testHTML',
        value: function testHTML(file) {
            var props = [];
            if (ManifestItemProperties.isNav(file)) props.push('nav');
            if (ManifestItemProperties.isScripted(file)) props.push('scripted');
            if (ManifestItemProperties.isSVG(file)) props.push('svg');
            if (ManifestItemProperties.hasRemoteResources(file)) props.push('remote-resources');
            return props;
        }

        /**
         * Test if an object contains Dublin Core `term`s or `element`s
         * @param  {Object} data [description]
         * @return {Object<Boolean>}
         */

    }, {
        key: 'testMeta',
        value: function testMeta(data) {
            return {
                term: ManifestItemProperties.isDCTerm(data),
                element: ManifestItemProperties.isDCElement(data)
            };
        }
    }]);
    return ManifestItemProperties;
}();

exports.default = ManifestItemProperties;
>>>>>>> 832bbc7... Restructuring
