// Static file server at port 4000 serving from filesystem root.
// Needed because the reader manifest embeds absolute localhost:4000 URLs
// that include full filesystem paths (e.g. /Users/.../manifest.json).
// Must send CORS headers since the reader app runs on localhost:3000.
const http = require('http')
const fs = require('fs')
const path = require('path')

const MIME = {
  '.html': 'text/html',
  '.xhtml': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.opf': 'application/oebps-package+xml',
  '.ncx': 'application/x-dtbncx+xml',
  '.xml': 'application/xml',
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const filePath = decodeURIComponent(req.url.split('?')[0])

  try {
    const data = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end(`Not found: ${filePath}`)
  }
})

server.listen(4000, '127.0.0.1', () => {
  console.log('Content server ready on http://127.0.0.1:4000')
})
