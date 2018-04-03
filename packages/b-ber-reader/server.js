const path = require('path')
const express = require('express')
const manifest = require('./books.json')
const router = express.Router()
const app = express()
const PORT = 3000

const api = router.get('/books.json', (_, res) => res.json(manifest))

app.use(express.static('public'))
app.use('/epub', express.static(path.join(__dirname, 'epub')))
app.use('/api', api)

app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public/index.html')))

app.listen(PORT)

console.log(`Listening on http://localhost:${PORT}/`)
