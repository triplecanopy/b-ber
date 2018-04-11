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

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Guide = function () {
    function Guide() {
        (0, _classCallCheck3.default)(this, Guide);
    }

    (0, _createClass3.default)(Guide, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'guide.body.tmpl',
                contents: new Buffer('<guide>{% body %}</guide>')
            });
        }
    }, {
        key: 'item',
        value: function item(_ref) {
            var type = _ref.type,
                title = _ref.title,
                href = _ref.href;

            return '<reference type="' + type + '" title="' + title + '" href="' + href + '"/>';
        }
    }, {
        key: 'items',
        value: function items(data) {
            return data.map(function (a) {
                var item = '';
                var type = void 0;
                if (type = a.type) {

                    _bBerLogger2.default.info('guide adding landmark [' + a.fileName + '] as [' + type + ']');

                    var title = (0, _utils.escapeHTML)(a.title);
                    var href = encodeURI(a.relativePath) + '.xhtml';
                    item = Guide.item({ type: type, title: title, href: href });
                }

                return item;
            }).join('');
        }
    }]);
    return Guide;
}();

exports.default = Guide;