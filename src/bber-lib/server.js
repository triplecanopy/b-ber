
/* eslint-disable */

// var express = require('express')
// var esindex = require('serve-index')
// var path = require('path')
// var bunyan = require('bunyan')
// var bformat = require('bunyan-format')

// var cwd = process.cwd()

// var formatOut = bformat({ outputMode: 'short' })
// var log = bunyan.createLogger({ name: 'bber', stream: formatOut, level: 'debug' })

// var args = {}
// process.argv.forEach(function(arg) {
//   var arr = arg.split(' ')
//   return args[arr[0]] = arr[1]
// })

// var port = Number(args['--port']) || 3000
// var dir = port === 4000 ? path.join(cwd, 'book/OPS') : path.join(cwd, '_site')
// var hidden = ['.opf', '.ncx']
// var opts = {
//   filter: function (fname) {
//     return hidden.indexOf(path.extname(fname)) === -1
//   }
// }

// var app = express()
// app.use(express.static(dir))
// if (port === 4000) { app.use(esindex(dir, opts)) }

// app.listen(port, function() {
//   log.info('Server is running at localhost: ' + port)
// })

