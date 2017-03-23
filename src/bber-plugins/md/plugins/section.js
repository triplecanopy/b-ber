
/* eslint-disable */

/*! markdown-it-container 2.0.0 https://github.com//markdown-it/markdown-it-container @license MIT */(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownitContainer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Process block-level custom containers
//
'use strict';


module.exports = function container_plugin(md, name, options) {

  function validateDefault(params) {
    return params.trim().split(' ', 2)[0].replace(/-([a-z])/g, function (g) { // camelcase `params[0]`
      return g[1].toUpperCase();
    }) === name;
  }

  function renderDefault(tokens, idx, _options, env, self) {
    // add a class to the opening tag
    if (tokens[idx].nesting === 1) {
      tokens[idx].attrPush([ 'class', name ]);
    }

    return self.renderToken(tokens, idx, _options, env, self);
  }

  options = options || {};

  var marker_open = options.markerOpen,
    marker_close  = options.markerClose,
    min_markers   = options.minMarkers || 3,
    marker_str    = options.marker || ':',
    marker_char   = marker_str.charCodeAt(0),
    marker_len    = marker_str.length,
    callback      = options.callback || null,
    validateOpen  = options.validateOpen || validateDefault,
    validateClose = options.validateClose || validateDefault,
    render        = options.render || renderDefault;

  function container(state, startLine, endLine, silent) {
    var pos, nextLine, marker_count, markup, params, token, old_parent, old_line_max, match,
      auto_closed = false,
      start = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

    if (marker_char !== state.src.charCodeAt(start)) { return false; }

    // Check out the rest of the marker string, i.e., count the number of markers
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        break;
      }
    }

    marker_count = Math.floor((pos - start) / marker_len);
    if (marker_count < min_markers) { return false; }
    pos -= (pos - start) % marker_len;

    markup = state.src.slice(start, pos);
    params = state.src.slice(pos, max);

    if (!validateOpen(params) && !validateClose(params)) { return false; }
    if (silent) { return true; } // for testing validation

    if (validateOpen(params)) {

      nextLine = startLine;

      // look for `exit` tag
      for (;;) {
        nextLine++;

        if (nextLine >= endLine) {
          // unclosed block should be autoclosed by end of document.
          // also block seems to be autoclosed by end of parent
          break;
        }

        start = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];


        // find `exit` statement
        if (state.src.charCodeAt(start) === marker_char) {
          if (marker_close.exec(state.src.slice(start + marker_len, max))) {
            break;
          }
        }

        if (state.sCount[nextLine] - state.blkIndent >= 4) {
          // closing fence should be indented less than 4 spaces
          continue;
        }

        if (Math.floor((pos - start) / marker_len) < marker_count) { continue; }

        if (pos < max) { continue; }
        auto_closed = true

        break;
      }
    }

    old_parent       = state.parentType;
    old_line_max     = state.lineMax;
    state.parentType = 'container';

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax    = nextLine;

    token            = state.push('container_' + name + '_open', 'div', 1);
    token.markup     = markup;
    token.block      = true;
    token.info       = params;
    token.map        = [startLine, nextLine];

    state.md.block.tokenize(state, startLine + 1, nextLine);

    token            = state.push('container_' + name + '_close', 'div', -1);
    token.markup     = state.src.slice(start, pos) + ' exit section';
    token.block      = true;

    state.parentType = old_parent;
    state.lineMax    = old_line_max;
    state.line       = nextLine + (auto_closed ? 1 : 0);

    return true;
  }

  md.block.ruler.before('fence', 'container_' + name, container, {
    alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
  });
  md.renderer.rules['container_' + name + '_open'] = render;
  md.renderer.rules['container_' + name + '_close'] = render;
};

},{}]},{},[1])(1)
});
