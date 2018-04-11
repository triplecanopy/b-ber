'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = require('@canopycanopycanopy/b-ber-lib/utils');

var _bBerLogger = require('@canopycanopycanopy/b-ber-logger');

var _bBerLogger2 = _interopRequireDefault(_bBerLogger);

var _epub = require('./epub');

var _epub2 = _interopRequireDefault(_epub);

var _mobi = require('./mobi');

var _mobi2 = _interopRequireDefault(_mobi);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var figures = { epub: _epub2.default, mobi: _mobi2.default };

var isImage = function isImage(mime) {
    return (/^image/.test(mime)
    );
};
var isAudio = function isAudio(mime) {
    return (/^audio/.test(mime)
    );
};
var isVideo = function isVideo(mime) {
    return (/^video/.test(mime)
    );
};
var isIframe = function isIframe(type) {
    return type === 'iframe';
};

var figure = function figure(data, env) {
    var width = data.width,
        height = data.height,
        mime = data.mime,
        type = data.type;

    var _env = !env || !{}.hasOwnProperty.call(figures, env) ? 'epub' : env;

    var format = null;
    if (isIframe(type)) {
        format = 'iframe';
    } else if (isImage(mime)) {
        format = (0, _utils.getImageOrientation)(width, height);
    } else if (isAudio(mime)) {
        format = 'audio';
    } else if (isVideo(mime)) {
        format = 'video';
    }

    if (!format) {
        _bBerLogger2.default.error('bber-templates: [' + data.source + '] is of unsupported media type [' + mime + ']');
    }

    return figures[_env][format](data);
};

exports.default = figure;