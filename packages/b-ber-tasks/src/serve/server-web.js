import path from 'path'
import express from 'express'
import serveIndex from 'serve-index'
import {parseArgs} from './helpers'

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

