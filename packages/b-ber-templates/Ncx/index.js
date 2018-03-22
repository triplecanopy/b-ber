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

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _State = require('@canopycanopycanopy/b-ber-lib/State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Ncx = function () {
    function Ncx() {
        (0, _classCallCheck3.default)(this, Ncx);
    }

    (0, _createClass3.default)(Ncx, null, [{
        key: 'head',
        value: function head() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'identifier' });
            var identifier = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <head>\n                <meta name="dtb:uid" content="' + identifier + '"/>\n                <meta name="dtb:depth" content="1"/>\n                <meta name="dtb:totalPageCount" content="1"/>\n                <meta name="dtb:maxPageNumber" content="1"/>\n            </head>\n        ';
        }
    }, {
        key: 'title',
        value: function title() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'title' });
            var title = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <docTitle>\n                <text>' + (0, _utils.escapeHTML)(title) + '</text>\n            </docTitle>\n        ';
        }
    }, {
        key: 'author',
        value: function author() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'creator' });
            var creator = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <docAuthor>\n                <text>' + (0, _utils.escapeHTML)(creator) + '</text>\n            </docAuthor>\n        ';
        }
    }, {
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'ncx.document.tmpl',
                contents: new Buffer('<?xml version="1.0" encoding="UTF-8"?>\n                <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n                    ' + Ncx.head() + '\n                    ' + Ncx.title() + '\n                    ' + Ncx.author() + '\n                    <navMap>\n                        {% body %}\n                    </navMap>\n                </ncx>\n            ')
            });
        }
    }, {
        key: 'navPoint',
        value: function navPoint(data) {
            return '\n            <navLabel>\n                <text>' + (0, _utils.escapeHTML)((0, _utils.getTitleOrName)(data)) + '</text>\n            </navLabel>\n            <content src="' + data.relativePath + '.xhtml" />\n        ';
        }
    }, {
        key: 'navPoints',
        value: function navPoints(data) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            var index_ = index;
            return data.map(function (a) {
                if (a.in_toc === false) return '';
                index_ += 1;
                return '\n                <navPoint id="navPoint-' + index_ + '" playOrder="' + index_ + '">\n                    ' + Ncx.navPoint(a) + '\n                    ' + (a.nodes && a.nodes.length ? Ncx.navPoints(a.nodes, index_) : '') + '\n                </navPoint>\n            ';
            }).join('');
        }
    }]);
    return Ncx;
}();

exports.default = Ncx;
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

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _State = require('@canopycanopycanopy/b-ber-lib/State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Ncx = function () {
    function Ncx() {
        (0, _classCallCheck3.default)(this, Ncx);
    }

    (0, _createClass3.default)(Ncx, null, [{
        key: 'head',
        value: function head() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'identifier' });
            var identifier = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <head>\n                <meta name="dtb:uid" content="' + identifier + '"/>\n                <meta name="dtb:depth" content="1"/>\n                <meta name="dtb:totalPageCount" content="1"/>\n                <meta name="dtb:maxPageNumber" content="1"/>\n            </head>\n        ';
        }
    }, {
        key: 'title',
        value: function title() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'title' });
            var title = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <docTitle>\n                <text>' + (0, _utils.escapeHTML)(title) + '</text>\n            </docTitle>\n        ';
        }
    }, {
        key: 'author',
        value: function author() {
            var entry = (0, _find2.default)(_State2.default.metadata, { term: 'creator' });
            var creator = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : '';
            return '\n            <docAuthor>\n                <text>' + (0, _utils.escapeHTML)(creator) + '</text>\n            </docAuthor>\n        ';
        }
    }, {
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'ncx.document.tmpl',
                contents: new Buffer('\n                <?xml version="1.0" encoding="UTF-8"?>\n                <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n                    ' + Ncx.head() + '\n                    ' + Ncx.title() + '\n                    ' + Ncx.author() + '\n                    <navMap>\n                        {% body %}\n                    </navMap>\n                </ncx>\n            ')
            });
        }
    }, {
        key: 'navPoint',
        value: function navPoint(data) {
            return '\n            <navLabel>\n                <text>' + (0, _utils.escapeHTML)((0, _utils.getTitleOrName)(data)) + '</text>\n            </navLabel>\n        ';
        }
    }, {
        key: 'navPoints',
        value: function navPoints(data) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return data.map(function (a) {
                if (a.in_toc === false) return '';
                index += 1;
                return '\n                <navPoint id="navPoint-' + index + '" playOrder="' + index + '">\n                    ' + Ncx.navPoint(a) + '\n                    ' + (a.nodes && a.nodes.length ? Ncx.navPoints(a.nodes, index) : '') + '\n                </navPoint>\n            ';
            }).join('');
        }
    }]);
    return Ncx;
}();

<<<<<<< HEAD
exports.default = Ncx;

/*
const navPoint = list => {
    let i = 0
    function render(arr) {
        return arr.map(a => {
            if (a.in_toc === false) return ''
            i += 1
            return `
                <navPoint id="navPoint-${i}" playOrder="${i}">
                    <navLabel>
                        <text>${escapeHTML(getTitleOrName(a))}</text>
                    </navLabel>
                    <content src="${a.relativePath}.xhtml" />
                    ${a.nodes && a.nodes.length ? render(a.nodes) : ''}
                </navPoint>`
        }).join('')
    }
    return render(list)
}
*/
>>>>>>> 832bbc7... Restructuring
||||||| parent of 3c03362... Refactoring; Builds
exports.default = Ncx;

/*
const navPoint = list => {
    let i = 0
    function render(arr) {
        return arr.map(a => {
            if (a.in_toc === false) return ''
            i += 1
            return `
                <navPoint id="navPoint-${i}" playOrder="${i}">
                    <navLabel>
                        <text>${escapeHTML(getTitleOrName(a))}</text>
                    </navLabel>
                    <content src="${a.relativePath}.xhtml" />
                    ${a.nodes && a.nodes.length ? render(a.nodes) : ''}
                </navPoint>`
        }).join('')
    }
    return render(list)
}
*/
=======
exports.default = Ncx;
>>>>>>> 3c03362... Refactoring; Builds
