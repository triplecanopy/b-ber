<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Xml = function () {
    function Xml() {
        (0, _classCallCheck3.default)(this, Xml);
    }

    (0, _createClass3.default)(Xml, null, [{
        key: 'container',
        value: function container() {
            return '<?xml version="1.0"?>\n            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n                <rootfiles>\n                    <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>\n                </rootfiles>\n            </container>\n        ';
        }
    }, {
        key: 'mimetype',
        value: function mimetype() {
            return 'application/epub+zip';
        }
    }]);
    return Xml;
}();

exports.default = Xml;
||||||| parent of 832bbc7... Restructuring
=======
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Xml = function () {
    function Xml() {
        (0, _classCallCheck3.default)(this, Xml);
    }

    (0, _createClass3.default)(Xml, null, [{
        key: "container",
        value: function container() {
            return "\n            <?xml version=\"1.0\"?>\n            <container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\">\n                <rootfiles>\n                    <rootfile full-path=\"OPS/content.opf\" media-type=\"application/oebps-package+xml\"/>\n                </rootfiles>\n            </container>\n        ";
        }
    }]);
    return Xml;
}();

exports.default = Xml;
>>>>>>> 832bbc7... Restructuring
