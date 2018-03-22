<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _State = require('@canopycanopycanopy/b-ber-lib/State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Toc = function () {
    function Toc() {
        (0, _classCallCheck3.default)(this, Toc);
    }

    (0, _createClass3.default)(Toc, null, [{
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'toc.document.tmpl',
                contents: new Buffer(_State2.default.templates.dynamicPageHead() + '\n                <nav id="toc" epub:type="toc">\n                    <h2>Table of Contents</h2>\n                    {% body %}\n                </nav>\n                ' + _State2.default.templates.dynamicPageTail() + '\n            ')
            });
        }
    }, {
        key: 'item',
        value: function item(data) {
            return '<a href="' + _path2.default.basename(data.relativePath) + '.xhtml">' + (0, _utils.escapeHTML)((0, _utils.getTitleOrName)(data)) + '</a>';
        }
    }, {
        key: 'items',
        value: function items(data) {
            return '\n            <ol>\n                ' + data.map(function (a) {
                if (a.in_toc === false) return '';
                return '\n                        <li>\n                            ' + Toc.item(a) + '\n                            ' + (a.nodes && a.nodes.length ? Toc.items(a.nodes) : '') + '\n                        </li>\n                    ';
            }).join('') + '\n            </ol>\n        ';
        }
    }]);
    return Toc;
}();

exports.default = Toc;
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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _State = require('@canopycanopycanopy/b-ber-lib/State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Toc = function () {
    function Toc() {
        (0, _classCallCheck3.default)(this, Toc);
    }

    (0, _createClass3.default)(Toc, null, [{
        key: 'document',
        value: function document() {
            return new _vinyl2.default({
                path: 'toc.document.tmpl',
                contents: new Buffer('\n                ' + _State2.default.templates.dynamicPageHead() + '\n                <nav id="toc" epub:type="toc">\n                    <h2>Table of Contents</h2>\n                    {% body %}\n                </nav>\n                ' + _State2.default.templates.dynamicPageTail() + '\n            ')
            });
        }
    }, {
        key: 'item',
        value: function item(data) {
            return '<a href="' + _path2.default.basename(data.relativePath) + '.xhtml">' + (0, _utils.escapeHTML)((0, _utils.getTitleOrName)(data)) + '</a>';
        }
    }, {
        key: 'items',
        value: function items(data) {
            return '\n            <ol>\n                ' + data.map(function (a) {
                if (a.in_toc === false) return '';
                return '\n                        <li>\n                            ' + Toc.item(a) + '\n                            ' + (a.nodes && a.nodes.length ? Toc.items(a.nodes) : '') + '\n                        </li>\n                    ';
            }).join('') + '\n            </ol>\n        ';
        }
    }]);
    return Toc;
}();

<<<<<<< HEAD
exports.default = Toc;
/*
const tocItem = list => {
    function render(items) {
        return `
            <ol>
                ${items.map(a => // eslint-disable-line no-confusing-arrow
                    (a.in_toc === false)
                    ? ''
                    : `<li>
                        <a href="${path.basename(a.relativePath)}.xhtml">${escapeHTML(getTitleOrName(a))}</a>
                            ${a.nodes && a.nodes.length ? render(a.nodes) : ''}
                        </li>`
                ).join('')}
            </ol>`
    }

    return render(list)
}*/
>>>>>>> 832bbc7... Restructuring
||||||| parent of 3c03362... Refactoring; Builds
exports.default = Toc;
/*
const tocItem = list => {
    function render(items) {
        return `
            <ol>
                ${items.map(a => // eslint-disable-line no-confusing-arrow
                    (a.in_toc === false)
                    ? ''
                    : `<li>
                        <a href="${path.basename(a.relativePath)}.xhtml">${escapeHTML(getTitleOrName(a))}</a>
                            ${a.nodes && a.nodes.length ? render(a.nodes) : ''}
                        </li>`
                ).join('')}
            </ol>`
    }

    return render(list)
}*/
=======
exports.default = Toc;
>>>>>>> 3c03362... Refactoring; Builds
