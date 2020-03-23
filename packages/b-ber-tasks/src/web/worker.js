/* eslint-disable */

// This file is written as-is to `project-web` on `bber build --web`.
// It manages the WebWorker for search.

importScripts('%BASE_URL%' + 'lunr.js') // BASE_URL added dynamically on build
var searchIndex
var records = []
var readyState = 0

function onRequestReadyStateChange(state) {
  if (!state) state = null
  readyState = state || this.readyState
  postMessage({ readyState: readyState })
}

// TODO: prebuild index during web build, see here: https://lunrjs.com/guides/index_prebuilding.html
// @issue: https://github.com/triplecanopy/b-ber/issues/231
function onRequestLoad() {
  records = JSON.parse(this.responseText)
  searchIndex = lunr(function() {
    this.metadataWhitelist = ['position']

    this.field('title')
    this.field('body')
    this.ref('id')

    records.forEach(function(record, i) {
      this.add(record)
    }, this)
  })

  onRequestReadyStateChange(this.readyState)
}

function getSearchIndex() {
  var req = new XMLHttpRequest()
  req.addEventListener('load', onRequestLoad)
  req.addEventListener('open', onRequestReadyStateChange)
  req.addEventListener('send', onRequestReadyStateChange)
  req.open('GET', '%BASE_URL%' + 'search-index.json')
  req.send()
}

function trimResultBody(data) {
  return data
}

function parseSearchResults(results) {
  var output = []
  var markerStart = '<mark>'
  var markerEnd = '</mark>'
  var markerLength = markerStart.length + markerEnd.length
  var markerOffset = 0 // account for the marker tags length
  var resultsObject = {} // list of results; iterated over in worker-init.js
  var text = '' // found text
  var textOffset = 100 // number of chars before and after match to append to each result for context

  if (!results || !results.length) return output
  results.forEach(function(result) {
    Object.keys(result.matchData.metadata).forEach(function(term) {
      var match = result.matchData.metadata[term]

      resultsObject = {}
      resultsObject.url = records[result.ref].url

      Object.keys(match).forEach(function(fieldName) {
        var position = match[fieldName].position

        for (var i = 0; i < position.length; i++) {
          var content = records[result.ref][fieldName].trim()
          if (!content) continue // guard for fuzzy searches ... should be handled better

          var begin = position[i][0]
          var length = position[i][1]

          var firstIndex = begin - textOffset

          var prefix = firstIndex < 0 ? '...' : ''
          var before = content.slice(firstIndex, begin)
          var marked =
            markerStart + content.slice(begin, begin + length) + markerEnd
          var after = content.slice(begin + length, begin + length + textOffset)
          var suffix = begin + length + textOffset > content.length ? '' : '...'

          text =
            '<span class="search__result__text">' +
            prefix +
            before +
            marked +
            after +
            suffix +
            '</span>'
        }

        resultsObject[fieldName] = text
      })

      output.push(resultsObject)
    })
  })

  return output
}

function doSearch(term) {
  var results = searchIndex.query(function(q) {
    q.term(term, {
      fields: ['title', 'body'],
      // boost: 1,
      editDistance: 1,
      // usePipeline: false,
      // wildcard: lunr.Query.wildcard.LEADING,
      // wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
    })
  })

  return parseSearchResults(results)
}

getSearchIndex()

onmessage = function(e) {
  if (readyState < 4) return
  var results = doSearch(e.data.term)
  postMessage({ results: results })
}
