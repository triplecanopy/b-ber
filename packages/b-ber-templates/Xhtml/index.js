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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Xhtml = function () {
    function Xhtml() {
        (0, _classCallCheck3.default)(this, Xhtml);
    }

    (0, _createClass3.default)(Xhtml, null, [{
        key: 'head',
        value: function head() {

            // TODO: whitespace should be trimmed from the doc start and end after
            // b-ber runs

            return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n            <html xmlns="http://www.w3.org/1999/xhtml"\n                xmlns:epub="http://www.idpf.org/2007/ops"\n                xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"\n                epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">\n            <head>\n                <title></title>\n                <meta http-equiv="default-style" content="text/html charset=utf-8"/>\n                <!-- inject:css -->\n                <!-- end:css -->\n            </head>\n            <body>\n        ';
        }
    }, {
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'page.body.tmpl',
                contents: new Buffer('{% body %}')
            });
        }
    }, {
        key: 'tail',
        value: function tail() {
            return '\n                <!-- inject:js -->\n                <!-- end:js -->\n                <!-- inject:metadata -->\n                <!-- end:metadata -->\n            </body>\n        </html>\n        ';
        }
    }, {
        key: 'cover',
        value: function cover(_ref) {
            var width = _ref.width,
                height = _ref.height,
                href = _ref.href;

            return '\n            <section class="cover" style="text-align: center; padding: 0; margin: 0;">\n                <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ' + width + ' ' + height + '" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">\n                    <image width="' + width + '" height="' + height + '" xlink:href="../' + href + '"/>\n                </svg>\n            </section>\n        ';
        }
    }, {
        key: 'script',
        value: function script() {
            var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'application/javascript';
            var inline = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return '<script type="' + type + '" ' + (inline ? '' : 'src="{% body %}"') + '></script>';
        }
    }, {
        key: 'stylesheet',
        value: function stylesheet() {
            return '<link rel="stylesheet" type="text/css" href="{% body %}"/>';
        }
    }, {
        key: 'loi',
        value: function loi() {
            return '\n            <section epub:type="loi" title="Figures" class="chapter figures">\n                <header>\n                    <h1>Figures</h1>\n                </header>\n            </section>\n        ';
        }
    }, {
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'xhtml.document.tmpl',
                contents: new Buffer(Xhtml.head() + '\n                    {% body %}\n                ' + Xhtml.tail() + '\n            ')
            });
        }
    }]);
    return Xhtml;
}();

exports.default = Xhtml;
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Xhtml = function () {
    function Xhtml() {
        (0, _classCallCheck3.default)(this, Xhtml);
    }

    (0, _createClass3.default)(Xhtml, null, [{
        key: 'head',
        value: function head() {
            return '\n            <?xml version="1.0" encoding="UTF-8" standalone="no"?>\n            <html xmlns="http://www.w3.org/1999/xhtml"\n                xmlns:epub="http://www.idpf.org/2007/ops"\n                xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"\n                epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">\n            <head>\n                <title></title>\n                <meta http-equiv="default-style" content="text/html charset=utf-8"/>\n                <!-- inject:css -->\n                <!-- end:css -->\n            </head>\n            <body>\n        ';
        }
    }, {
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'page.body.tmpl',
                contents: new Buffer('{% body %}')
            });
        }
    }, {
        key: 'tail',
        value: function tail() {
            return '\n                <!-- inject:js -->\n                <!-- end:js -->\n                <!-- inject:metadata -->\n                <!-- end:metadata -->\n            </body>\n        </html>\n        ';
        }
    }, {
        key: 'cover',
        value: function cover(_ref) {
            var width = _ref.width,
                height = _ref.height,
                href = _ref.href;

            return '\n            <section class="cover" style="text-align: center; padding: 0; margin: 0;">\n                <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ' + width + ' ' + height + '" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">\n                    <image width="' + width + '" height="' + height + '" xlink:href="../' + href + '"/>\n                </svg>\n            </section>\n        ';
        }
    }, {
        key: 'script',
        value: function script() {
            var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'application/javascript';

            return '<script type="' + type + '" src="{% body %}"></script>';
        }
    }, {
        key: 'stylesheet',
        value: function stylesheet() {
            return '<link rel="stylesheet" type="text/css" href="{% body %}"/>';
        }
    }, {
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'xhtml.document.tmpl',
                contents: new Buffer('\n                ' + Xhtml.head() + '\n                    {% body %}\n                ' + Xhtml.tail() + '\n            ')
            });
        }
    }]);
    return Xhtml;
}();

exports.default = Xhtml;

/*
const loiLeader = () =>
    `<section epub:type="loi" title="Figures" class="chapter figures">
        <header>
            <h1>Figures</h1>
        </header>
    </section>`

export {pageHead, pageTail, pageBody, page, loiLeader}
*/
>>>>>>> 832bbc7... Restructuring
