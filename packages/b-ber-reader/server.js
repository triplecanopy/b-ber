/*

Add compiled b-ber reader projects to an epub dir in b-ber-reader. These will be
served when running `npm start` from the b-ber-reader dir at
http://localhost:4000 or at the provided hostname and port

*/

const fs = require('fs')
const url = require('url')
const path = require('path')
const express = require('express') // eslint-disable-line import/no-extraneous-dependencies

const HOST = process.env.BBER_HOST || 'localhost'
const PORT = process.env.BBER_PORT || 4000
const BASE_DIR = 'epub'
const baseURL = `http://${HOST}:${PORT}/`

const router = express.Router()
const app = express()

let manifest
manifest = fs.readdirSync(`./${BASE_DIR}`).filter(a => /^\./.test(a) === false)
manifest = manifest.map(dir => ({
  id: String(Math.random()).slice(2),
  title: dir,
  url: `${baseURL}${BASE_DIR}/${dir}`,
  cover: url.resolve(
    `${baseURL}${BASE_DIR}/${dir}/OPS/images/`,
    fs
      .readdirSync(`./${BASE_DIR}/${dir}/OPS/images`)
      .find(img => /__bber_cover__/.test(img)) || ''
  ),
}))

const api = router.get('/books.json', (_, res) => res.json(manifest))

app.use(express.static('public'))
app.use(`/${BASE_DIR}`, express.static(path.join(__dirname, BASE_DIR)))
app.use('/api', api)
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
)
app.listen(PORT, '0.0.0.0')

console.log(`Listening on ${baseURL}`)
