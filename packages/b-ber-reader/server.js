/* eslint-disable import/no-extraneous-dependencies */

/*

Add compiled b-ber reader projects to an epub dir in b-ber-reader. These will be
served when running `npm start` from the b-ber-reader dir at
http://localhost:4000 or at the provided hostname and port

*/

const fs = require('fs')
const url = require('url')
const path = require('path')
const express = require('express')
const xmljs = require('xml-js')

const HOST = process.env.BBER_HOST || 'localhost'
const PORT = process.env.BBER_PORT || 4000
const BASE_DIR = 'epub'
const baseURL = `http://${HOST}:${PORT}/`

const router = express.Router()
const app = express()

// Find each book's cover image
const getCoverUrlFromOpf = ({ dir, bookUrl }) => {
  const opf = fs.readFileSync(`./${BASE_DIR}/${dir}/OPS/content.opf`, 'utf-8')
  const xml = xmljs.xml2js(opf)

  // Get key for cover image from the `metadata` element
  const [elem] = xml.elements
  const meta = elem.elements.find(({ name }) => name === 'metadata')
  const coverMeta = meta.elements.find(
    ({ attributes }) => attributes.name === 'cover'
  )
  const { content: coverId } = coverMeta.attributes

  // Get cover image href from the `manifest` element
  const manifest = elem.elements.find(({ name }) => name === 'manifest')
  const cover = manifest.elements.find(
    ({ attributes }) => attributes.id === coverId
  )
  const { href: coverImagePath } = cover.attributes

  return url.resolve(bookUrl, `./${dir}/OPS/${coverImagePath}`)
}

// Get the list of books in the `epub` directory
const getEpubs = () => {
  const bookDirs = fs
    .readdirSync(`./${BASE_DIR}`)
    .filter(a => /^\./.test(a) === false)

  const bookData = bookDirs.map(dir => {
    const id = String(Math.random()).slice(2)
    const bookUrl = `${baseURL}${BASE_DIR}/${dir}`

    let cover = ''

    try {
      cover = getCoverUrlFromOpf({ dir, bookUrl })
    } catch (_) {
      // noop
    }

    return { id, title: dir, url: bookUrl, cover }
  })

  return bookData
}

const epubs = getEpubs()
const api = router.get('/books.json', (_, res) => res.json(epubs))

app.use(express.static('public'))
app.use(`/${BASE_DIR}`, express.static(path.join(__dirname, BASE_DIR)))
app.use('/api', api)
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
)
app.listen(PORT, '0.0.0.0')

console.log(`Listening on ${baseURL}`)
