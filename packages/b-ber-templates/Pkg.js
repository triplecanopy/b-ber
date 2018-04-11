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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Pkg = function () {
    function Pkg() {
        (0, _classCallCheck3.default)(this, Pkg);
    }

    (0, _createClass3.default)(Pkg, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'pkg.body.tmpl',
                contents: new Buffer('<?xml version="1.0" encoding="UTF-8"?>\n                <package\n                    version="3.0"\n                    xml:lang="en"\n                    unique-identifier="uuid"\n                    xmlns="http://www.idpf.org/2007/opf"\n                    xmlns:dc="http://purl.org/dc/elements/1.1/"\n                    xmlns:dcterms="http://purl.org/dc/terms/"\n                    prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/"\n                >\n                    {% body %}\n                </package>\n            ')
            });
        }
    }]);
    return Pkg;
}();

exports.default = Pkg;