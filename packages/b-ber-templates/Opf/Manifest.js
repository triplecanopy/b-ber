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

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _ManifestItemProperties = require('@canopycanopycanopy/b-ber-lib/ManifestItemProperties');

var _ManifestItemProperties2 = _interopRequireDefault(_ManifestItemProperties);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Manifest = function () {
    function Manifest() {
        (0, _classCallCheck3.default)(this, Manifest);
    }

    (0, _createClass3.default)(Manifest, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'manifest.body.tmpl',
                contents: new Buffer('<manifest>{% body %}</manifest>')
            });
        }
    }, {
        key: 'item',
        value: function item(file) {
            var props = _ManifestItemProperties2.default.testHTML(file);
            var name = file.name,
                opsPath = file.opsPath,
                absolutePath = file.absolutePath,
                remote = file.remote;

            return '\n            <item\n                id="' + (0, _utils.fileId)(name) + '"\n                href="' + encodeURI(opsPath) + '"\n                media-type="' + (!remote ? _mimeTypes2.default.lookup(absolutePath) : 'application/octet-stream') + '"\n                ' + (props && props.length ? 'properties="' + props.join(' ') + '"' : '') + '\n            />\n        ';
        }
    }]);
    return Manifest;
}();

exports.default = Manifest;
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

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Manifest = function () {
    function Manifest() {
        (0, _classCallCheck3.default)(this, Manifest);
    }

    (0, _createClass3.default)(Manifest, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'manifest.body.tmpl',
                contents: new Buffer('<manifest>{% body %}</manifest>')
            });
        }
    }, {
        key: 'item',
        value: function item(_ref) {
            var name = _ref.name,
                opsPath = _ref.opsPath,
                absolutePath = _ref.absolutePath,
                remote = _ref.remote;

            // props ...
            return '\n            <item\n                id="' + (0, _utils.fileId)(name) + '"\n                href="' + encodeURI(opsPath) + '"\n                media-type="' + (!remote ? _mimeTypes2.default.lookup(absolutePath) : 'application/octet-stream') + '"\n            />\n        ';
            //(props && props.length ? `properties="${props.join(' ')}"` : '')
        }
    }]);
    return Manifest;
}();

exports.default = Manifest;

/*
const manifestItem = file => {
    const props = ManifestItemProperties.testHTML(file)
    let res = null

    if (mime.lookup(file.absolutePath) !== 'application/oebps-package+xml') {
        res = [
            `<item id="${fileId(file.name)}"`,
            `href="${encodeURI(file.opsPath)}"`,
            `media-type="${!file.remote ? mime.lookup(file.absolutePath) : 'application/octet-stream'}"`, // TODO: fixme remote resources
            (props && props.length ? `properties="${props.join(' ')}"` : ''),
            '/>',
        ]
        .filter(Boolean)
        .join(' ')
    }
    return res
}


*/
>>>>>>> 832bbc7... Restructuring
