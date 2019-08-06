/*

Add compiled b-ber reader projects to an epub dir in b-ber-reader. These will be
served when running `npm start` from the b-ber-reader dir at
http://localhost:4000

*/

const fs = require('fs')
const url = require('url')
const path = require('path')
const express = require('express') // eslint-disable-line import/no-extraneous-dependencies

const PORT = 4000
const BASE_DIR = 'epub'

const router = express.Router()
const app = express()

let manifest
manifest = fs.readdirSync(`./${BASE_DIR}`).filter(a => /^\./.test(a) === false)
manifest = manifest.map(dir => ({
    title: dir,
    url: `http://localhost:${PORT}/${BASE_DIR}/${dir}`,
    cover: url.resolve(
        `http://localhost:${PORT}/${BASE_DIR}/${dir}/OPS/images/`,
        fs.readdirSync(`./${BASE_DIR}/${dir}/OPS/images`).find(img => /__bber_cover__/.test(img)) || ''
    ),
    id: String(Math.random()).slice(2),
}))

const api = router.get('/books.json', (_, res) => res.json(manifest))

app.use(express.static('public'))
app.use(`/${BASE_DIR}`, express.static(path.join(__dirname, BASE_DIR)))
app.use('/api', api)
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.listen(PORT)

console.log(`Listening on http://localhost:${PORT}/`)
