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

var _State = require('@canopycanopycanopy/b-ber-lib/State');

var _State2 = _interopRequireDefault(_State);

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Spine = function () {
    function Spine() {
        (0, _classCallCheck3.default)(this, Spine);
    }

    (0, _createClass3.default)(Spine, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'spine.body.tmpl',
                contents: new Buffer('<spine toc="_toc_ncx">{% body %}</spine>')
            });
        }
    }, {
        key: 'item',
        value: function item(_ref) {
            var fname = _ref.fname,
                linear = _ref.linear;

            return '<itemref idref="' + fname + '_xhtml" linear="' + linear + '"/>';
        }
    }, {
        key: 'items',
        value: function items(data) {
            return data.map(function (a) {
                var nonLinear = a.linear === false;
                var linear = nonLinear ? 'no' : 'yes';
                var fname = (0, _utils.fileId)(_path2.default.basename(a.fileName, a.extname));

                if (nonLinear) _bBerLogger2.default.info('templates/spine writing non-linear asset [' + a.fileName + ']');

                if (fname.match(/figure/)) {
                    // TODO: this should be handled more transparently, rn it feels a bit like a side-effect

                    _bBerLogger2.default.info('templates/spine writing [loi]');

                    if (_State2.default.loi.length) {
                        var loi = '<itemref idref="' + fname + '_xhtml" linear="' + linear + '"/>';
                        _State2.default.loi.forEach(function (figure) {
                            return loi += '<itemref idref="' + (0, _utils.fileId)(figure.fileName) + '" linear="yes"/>';
                        });
                        return loi;
                    }
                }

                return Spine.item({ fname: fname, linear: linear });
            }).join('');
        }
    }]);
    return Spine;
}();

exports.default = Spine;
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

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Spine = function () {
    function Spine() {
        (0, _classCallCheck3.default)(this, Spine);
    }

    (0, _createClass3.default)(Spine, null, [{
        key: 'body',
        value: function body() {
            return new _vinyl2.default({
                path: 'spine.body.tmpl',
                contents: new Buffer('<spine toc="_toc_ncx">{% body %}</spine>')
            });
        }
    }, {
        key: 'item',
        value: function item(_ref) {
            var fname = _ref.fname,
                linear = _ref.linear;

            return '<itemref idref="' + fname + '_xhtml" linear="' + linear + '"/>';
        }
    }, {
        key: 'items',
        value: function items(data) {
            return data.map(function (a) {
                var nonLinear = a.linear === false;
                var linear = nonLinear ? 'no' : 'yes';
                var fname = (0, _utils.fileId)(_path2.default.basename(a.fileName, a.extname));

                if (nonLinear) _bBerLogger2.default.info('Writing non-linear asset [' + a.fileName + '] to [spine]');

                if (fname.match(/figure/)) {
                    // TODO: this should be handled more transparently, rn it feels a bit like a side-effect

                    _bBerLogger2.default.info('Writing [LOI] to [spine]');

                    if (state.loi.length) {
                        var loi = '<itemref idref="' + fname + '_xhtml" linear="' + linear + '"/>';
                        state.loi.forEach(function (figure) {
                            return loi += '<itemref idref="' + (0, _utils.fileId)(figure.fileName) + '" linear="yes"/>';
                        });
                        return loi;
                    }
                }

                return Spine.item({ fname: fname, linear: linear });
            }).join('');
        }
    }]);
    return Spine;
}();

<<<<<<< HEAD

        return `<itemref idref="${fname}_xhtml" linear="${linear}"/>`
    }).join('')*/
>>>>>>> 832bbc7... Restructuring
||||||| parent of 3c03362... Refactoring; Builds

        return `<itemref idref="${fname}_xhtml" linear="${linear}"/>`
    }).join('')*/
=======
exports.default = Spine;
>>>>>>> 3c03362... Refactoring; Builds
