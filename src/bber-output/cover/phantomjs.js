/* globals document, phantom */
/* eslint-disable no-var, prefer-arrow-callback, import/no-unresolved, vars-on-top */
var system = require('system')
var page = require('webpage').create()

var args = system.args
var outFile = args[2]

page.content = args[1]
page.viewportSize = { width: 600, height: 800 }

page.settings.resourceTimeout = 1
page.settings.javascriptEnabled = false
page.settings.loadImages = false
page.settings.webSecurityEnabled = false

page.evaluate(function evaluate() {
  var body = document.body
  var spans = document.getElementsByTagName('span')

  body.style.backgroundColor = 'white'
  body.style.margin = '30px'
  body.style.fontFamily = 'Helvetica'

  for (var i = 0; i < spans.length; i++) {
    spans[i].style.textTransform = 'uppercase'
    spans[i].style.display = 'block'
    spans[i].style.paddingBottom = '5px'
    spans[i].style.fontSize = '0.7rem'
  }
})

page.render(outFile)
phantom.exit(0)
