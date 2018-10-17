const fs = require('fs-extra')
const path = require('path')
const express = require('express')
const { parseArgs } = require('./helpers')

const cwd = process.cwd()
const app = express()
const router = express.Router()
const argv = parseArgs(process.argv)
const { port, dir } = argv

const api = router.get('/books.json', (_, res) =>
    fs
        .readFile(path.join(cwd, dir, 'api', 'books.json'), 'utf8')
        .then(data => res.json(JSON.parse(data)))
        .catch(console.error),
)

app.use(express.static(dir))
app.use('/epub', express.static(path.join(dir, 'epub')))
app.use('/api', api)

app.get('/', (_, res) =>
    res.sendFile(path.join(dir, 'index.html'), { root: cwd }),
)

app.listen(port, _ => {
    console.log('Starting Nodemon')
    console.log(`Server is running at http://localhost:${port}/`)
    console.log('Enter rs to restart, CTRL + C to exit')
})
