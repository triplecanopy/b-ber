/*

Add compiled b-ber reader projects to an epub dir in b-ber-reader-react.
These will be served when running `npm start` from the b-ber-reader-react
dir at http://localhost:4000 or at the provided hostname and port

*/

const fs = require('fs')
const nodeUrl = require('url')
const path = require('path')
const express = require('express')

const HOST = process.env.BBER_HOST || 'localhost'
const PORT = process.env.BBER_PORT || 4000
const BASE_DIR = 'epub'
const baseURL = `http://${HOST}:${PORT}/`

const router = express.Router()
const app = express()

const bookDirs = fs
  .readdirSync(`./${BASE_DIR}`)
  .filter(a => /^\./.test(a) === false)

const id = () => String(Math.random()).slice(2)

const url = dir => `${baseURL}${BASE_DIR}/${dir}`

const cover = dir => {
  const image = fs
    .readdirSync(`./${BASE_DIR}/${dir}/OPS/images`)
    .find(img => /__bber_cover__/.test(img))

  if (!image)
    return `http://via.placeholder.com/400x600/4D50C1/fff/?text=${dir}`

  return nodeUrl.resolve(`${baseURL}${BASE_DIR}/${dir}/OPS/images/`, image)
}

const manifest = bookDirs.map(dir => ({
  id: id(),
  title: dir,
  url: url(dir),
  cover: cover(dir),
}))

const api = router.get('/books.json', (_, res) => {
  console.log('manifest', manifest)
  return res.json(manifest)
})

app.use(express.static('public'))
app.use(`/${BASE_DIR}`, express.static(path.join(__dirname, BASE_DIR)))
app.use('/api', api)
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
)
app.listen(PORT, '0.0.0.0')

console.log(`Listening on ${baseURL}`)
