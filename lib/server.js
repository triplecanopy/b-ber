
var express = require('express')
var esindex = require('serve-index')
var path = require('path')
var exec = require('child_process').exec
var bunyan = require('bunyan')
var bformat = require('bunyan-format')

var formatOut = bformat({ outputMode: 'short' })
var logger = bunyan.createLogger({ name: 'bber', stream: formatOut, level: 'debug' })

var dir = path.join(__dirname, '../', 'book', 'OPS')
var port = process.env.PORT || 3000
var hidden = ['.opf', '.ncx']
var onRestart = 'npm start -s -- build --invalid'
var opts = {
  filter(fname) { return hidden.indexOf(path.extname(fname)) === -1 }
}

var app = express()

app.use(express.static(dir))
app.use(esindex(dir, opts))
app.listen(port, function() {
  logger.info('Server is running at localhost: ' + port)
  exec(onRestart, { cwd: './' }, function(err, stdout, stderr) { // should invoke build, not start a new process
    if (err) { throw err }
    if (stderr) { logger.error(stderr) }
    if (stdout) { logger.info(stdout) }
  })
})
