
/* eslint-disable */

/*

html-pdf doesn't like being wrapped in a promise (never exits), so we fork a
child process to manage this task from /.tasks/pdf.js

*/

var path = require('path')
var html2pdf = require('html-pdf')
var defaults = {
  fname: new Date().toISOString().replace(/:/g, "-") + '.pdf',
  content: null,
  options: {
    height: '198mm',
    width: '130mm',
    orientation: 'portrait',
    border: {
      left: '7mm',
      top: '7mm',
      bottom: '10mm',
      right: '7mm'
    },
    header: {
      height: '14mm',
      contents: '<div style="text-align: center; font-family:Helvetica; font-size:12px; color: lightgrey;">Made with bber</div>' // eslint-disable-line max-len
    },
    footer: {
      height: '5mm',
      default: '<span>{{page}}</span>/<span>{{pages}}</span>'
    },
    base: null,
    timeout: 10000
  }
}


process.on('message', function(msg) {
  console.log('Compiling PDF')
  var settings = Object.assign({}, defaults, msg)
  html2pdf
    .create(settings.content, settings.options)
    .toFile(path.join(process.cwd(), './' + settings.fname), function(err, data) {
      // if (err) { throw err } // better to send this to parent?
      var status = err !== null ? 1 : 0
      var response = Object.assign({}, { status: status, err: err }/*, settings*/)
      process.send(response)
      process.exit(status)
    })
})
