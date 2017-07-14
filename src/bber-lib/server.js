const express = require('express')
const esindex = require('serve-index')
const path = require('path')
const log = require('../bber-plugins').log

const parseArgs = (args) => {
  const _argv = args.slice(2)
  const argv = {}
  _argv.forEach((_) => {
    const [k, v] = _.split(' ')
    argv[k.replace(/^-+/, '')] = v
    return argv
  })
  return argv
}

const argv = parseArgs(process.argv)
const { port, dir } = argv
const hidden = ['.opf', '.ncx']
const opts = {
  filter(fname) {
    return hidden.indexOf(path.extname(fname)) === -1
  },
}

const app = express()
app.use(express.static(dir))
app.use(esindex(dir, opts))
app.listen(port, () => log.info(`Server is running at [http://localhost:${port}/]`))

