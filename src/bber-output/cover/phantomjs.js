var system = require('system')
var args = system.args
var page = require('webpage').create()

page.viewportSize = { width: 600, height: 800 }
page.content = args[1]
const outFile = args[2]

page.evaluate(function () {
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
phantom.exit()
