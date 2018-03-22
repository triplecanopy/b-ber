<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _ManifestItemProperties = require('@canopycanopycanopy/b-ber-lib/ManifestItemProperties');

var _ManifestItemProperties2 = _interopRequireDefault(_ManifestItemProperties);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Metadata = function () {
    function Metadata() {
        (0, _classCallCheck3.default)(this, Metadata);
    }

    (0, _createClass3.default)(Metadata, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'metadata.body.tmpl',
                contents: new Buffer('<metadata>{% body %}</metadata>')
            });
        }
    }, {
        key: 'meta',
        value: function meta(data) {
            var _ManifestItemProperti = _ManifestItemProperties2.default.testMeta(data),
                term = _ManifestItemProperti.term,
                element = _ManifestItemProperti.element;

            var itemid = element && data.term === 'identifier' ? 'uuid' : '_' + _crypto2.default.randomBytes(20).toString('hex');
            var res = [];
            if (term) res.push('<meta property="dcterms:' + data.term + '">' + data.value + '</meta>');
            if (element) res.push('<dc:' + data.term + ' id="' + itemid + '">' + data.value + '</dc:' + data.term + '>');
            if (term && element && {}.hasOwnProperty.call(data, 'term_property') && {}.hasOwnProperty.call(data, 'term_property_value')) {
                res.push('<meta refines="#' + itemid + '" property="' + data.term_property + '">' + data.term_property_value + '</meta>'); // eslint-disable-line max-len
            }

            if (!term && !element) {
                // meta element for the cover references the id in the manifest, so we
                // create a case to encode it properly :/
                if (data.term !== 'cover') {
                    res.push('<meta name="' + data.term + '" content="' + data.value + '"/>');
                } else {
                    res.push('<meta name="' + data.term + '" content="' + (0, _utils.fileId)(data.value) + '"/>');
                }
            }
            return res.join('');
        }
    }]);
    return Metadata;
}();

exports.default = Metadata;
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

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _ManifestItemProperties = require('@canopycanopycanopy/b-ber-lib/ManifestItemProperties');

var _ManifestItemProperties2 = _interopRequireDefault(_ManifestItemProperties);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Metadata = function () {
    function Metadata() {
        (0, _classCallCheck3.default)(this, Metadata);
    }

    (0, _createClass3.default)(Metadata, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'metadata.body.tmpl',
                contents: new Buffer('<metadata>{% body %}</metadata>')
            });
        }
    }, {
        key: 'meta',
        value: function meta(data) {
            var _ManifestItemProperti = _ManifestItemProperties2.default.testMeta(data),
                term = _ManifestItemProperti.term,
                element = _ManifestItemProperti.element;

            var itemid = element && data.term === 'identifier' ? 'uuid' : '_' + _crypto2.default.randomBytes(20).toString('hex');
            var res = [];
            if (term) res.push('<meta property="dcterms:' + data.term + '">' + data.value + '</meta>');
            if (element) res.push('<dc:' + data.term + ' id="' + itemid + '">' + data.value + '</dc:' + data.term + '>');
            if (term && element && {}.hasOwnProperty.call(data, 'term_property') && {}.hasOwnProperty.call(data, 'term_property_value')) {
                res.push('<meta refines="#' + itemid + '" property="' + data.term_property + '">' + data.term_property_value + '</meta>'); // eslint-disable-line max-len
            }

            if (!term && !element) {
                // meta element for the cover references the id in the manifest, so we
                // create a case to encode it properly :/
                if (data.term !== 'cover') {
                    res.push('<meta name="' + data.term + '" content="' + data.value + '"/>');
                } else {
                    res.push('<meta name="' + data.term + '" content="' + (0, _utils.fileId)(data.value) + '"/>');
                }
            }
            return res.join('');
        }
    }]);
    return Metadata;
}();

<<<<<<< HEAD
exports.default = Metadata;

// const metatag = data => {
//     const {term, element} = ManifestItemProperties.testMeta(data)
//     const itemid = element && data.term === 'identifier' ? 'uuid' : `_${crypto.randomBytes(20).toString('hex')}`
//     const res = []
//     if (term) res.push(`<meta property="dcterms:${data.term">${data.value}</meta>`)}
//     if (element) res.push(`<dc:${data.term id="${itemid}">${data.value}</dc:${data.term}>`)}
//     if (term
//             && element
//             && {}.hasOwnProperty.call(data, 'term_property')
//             && {}.hasOwnProperty.call(data, 'term_property_value')) {
//         res.push(`<meta refines="#${itemid}" property="${data.term_property}">${data.term_property_value}</meta>`) // eslint-disable-line max-len
//     }

//     if (!term && !element) {
//          // meta element for the cover references the id in the manifest, so we
//          // create a case to encode it properly :/
//         if (data.term !== 'cover') {
//             res.push(`<meta name="${data.term}" content="${data.value}"/>`)
//         } else {
//             res.push(`<meta name="${data.term}" content="${fileId(data.value)}"/>`)
//         }
//     }
//     return res.join('')
// }
>>>>>>> 832bbc7... Restructuring
||||||| parent of 3c03362... Refactoring; Builds
exports.default = Metadata;

// const metatag = data => {
//     const {term, element} = ManifestItemProperties.testMeta(data)
//     const itemid = element && data.term === 'identifier' ? 'uuid' : `_${crypto.randomBytes(20).toString('hex')}`
//     const res = []
//     if (term) res.push(`<meta property="dcterms:${data.term">${data.value}</meta>`)}
//     if (element) res.push(`<dc:${data.term id="${itemid}">${data.value}</dc:${data.term}>`)}
//     if (term
//             && element
//             && {}.hasOwnProperty.call(data, 'term_property')
//             && {}.hasOwnProperty.call(data, 'term_property_value')) {
//         res.push(`<meta refines="#${itemid}" property="${data.term_property}">${data.term_property_value}</meta>`) // eslint-disable-line max-len
//     }

//     if (!term && !element) {
//          // meta element for the cover references the id in the manifest, so we
//          // create a case to encode it properly :/
//         if (data.term !== 'cover') {
//             res.push(`<meta name="${data.term}" content="${data.value}"/>`)
//         } else {
//             res.push(`<meta name="${data.term}" content="${fileId(data.value)}"/>`)
//         }
//     }
//     return res.join('')
// }
=======
exports.default = Metadata;
>>>>>>> 3c03362... Refactoring; Builds
