const express = require('express')
const serveIndex = require('serve-index')
const path = require('path')

const parseArgs = args => {
    const result = {}
    let args_

    args_ = args.slice(2)
    args_ = args_.map(a => a.split(/^--(\w+)\s/).filter(Boolean))
    args_.forEach(a => result[a[0]] = a[1] || true)
    return result
}

const argv = parseArgs(process.argv)
const {port, dir} = argv
const hidden = ['.opf', '.ncx']
const opts = {
    filter(fname) {
        return hidden.indexOf(path.extname(fname)) === -1
    },
}

const app = express()
app.use(express.static(dir))
app.use(serveIndex(dir, opts))
app.listen(port, _ => {
    console.log('Starting Nodemon')
    console.log(`Server is running at http://localhost:${port}/`)
    console.log('Enter rs to restart, CTRL + C to exit')
})

