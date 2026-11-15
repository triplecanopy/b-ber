// Turns one build's output into text that is identical from run to run, so
// that it can be compared with a committed snapshot (TASK-152).
//
// Every rule here hides something. Each one is listed in tasks/TASK-152.md
// under "What the snapshot ignores", and a new rule belongs there too.

import crypto from 'node:crypto'
import path from 'node:path'

// Text formats, compared line by line. Everything else is compared by hash
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.ncx',
  '.opf',
  '.xhtml',
  '.xml',
])

// Larger text files are vendored (lunr.js, 100 KB), not generated, and a hash
// says all a reviewer needs about them. The largest generated file, the
// compiled theme CSS, is about 45 KB, and stays text so a theme change diffs
const MAX_TEXT_BYTES = 64 * 1024

export const isText = (relPath: string, size: number): boolean =>
  (TEXT_EXTENSIONS.has(path.extname(relPath)) ||
    path.basename(relPath) === 'mimetype') &&
  size <= MAX_TEXT_BYTES

// The reader build copies in b-ber-reader-react's own Vite bundle, whose file
// names carry a content hash. It changes with every reader change, and the
// reader e2e suite covers it, so the snapshot records only that it is there
export const isReaderAppAsset = (format: string, relPath: string): boolean =>
  format === 'reader' && relPath.startsWith('assets/')

const VITE_HASHED_NAME = /(\/assets\/[\w.-]+?)-[\w-]{8}(\.(?:css|js|ttf))/g

// ISO 8601 date-times: the OPF's dcterms:modified and the manifests' `modified`
const TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g

// The `generator` meta in the OPF
const GENERATOR_VERSION = /b-ber@\d+\.\d+\.\d+[\w.-]*/g

// 16 hex characters, not part of a longer run: the random ids b-ber
// generates for OPF metadata (`_f6cca3820e4f6eb3`, with its `refines`) and for
// footnote references (`fn-1-b532308b3e637b23`). The cover image's name is a
// 40-character hash, which the lookarounds leave alone
const RANDOM_ID = /(?<![0-9a-f])[0-9a-f]{16}(?![0-9a-f])/g

export interface Normalizer {
  text(relPath: string, contents: string): string
}

// `roots` are the absolute paths the build may have written into its output:
// the fixture copy, and its real path (on macOS the temp directory is a
// symlink). One normalizer serves one build, so that a random id gets the
// same placeholder in every file that mentions it; call it on the files in
// sorted order, so the numbering does not depend on directory order
export const createNormalizer = (roots: string[]): Normalizer => {
  const ids = new Map<string, string>()
  const placeholder = (id: string) => {
    if (!ids.has(id)) ids.set(id, `{id:${ids.size + 1}}`)
    return ids.get(id) as string
  }

  // Longest first, so that a root that contains another is replaced whole
  const sortedRoots = [...new Set(roots)].sort((a, b) => b.length - a.length)

  return {
    text(relPath, contents) {
      let out = contents
      for (const root of sortedRoots) out = out.split(root).join('{fixture}')
      out = out
        .replace(TIMESTAMP, '{timestamp}')
        .replace(GENERATOR_VERSION, 'b-ber@{version}')
        .replace(VITE_HASHED_NAME, '$1-{hash}$2')
        .replace(RANDOM_ID, placeholder)

      if (path.extname(relPath) === '.opf') out = formatOpf(out)
      if (path.extname(relPath) === '.json') {
        out = `${JSON.stringify(sortUnordered(relPath, JSON.parse(out)), null, 2)}\n`
      }
      return out
    },
  }
}

// The OPF is written on one line. One element per line makes a diff name the
// element. The manifest's items are listed in the order an async directory
// walk returns them, which varies between runs; their order carries no
// meaning (the spine is the reading order), so sort them
const formatOpf = (xml: string): string =>
  xml
    .replace(/></g, '>\n<')
    .replace(
      /(<manifest>\n)([\s\S]*?)(\n<\/manifest>)/,
      (_, open: string, items: string, close: string) =>
        `${open}${items.split('\n').sort().join('\n')}${close}`
    )

// Not localeCompare, whose order depends on the machine's locale
const byCodePoint = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0

interface SearchEntry {
  id: number | string
  url: string
}

interface WebpubManifest {
  resources?: { href: string }[]
}

// Lists the builds write in a varying order that carries no meaning.
// - search-index.json: entries in whatever order chapters finish rendering,
//   numbered in that order. Sorted by URL, with the number dropped.
// - manifest.json `resources`: the same async directory walk as the OPF's
//   manifest. Sorted by href. `readingOrder` is the order, and is left alone
const sortUnordered = (relPath: string, data: unknown): unknown => {
  const name = path.basename(relPath)

  if (name === 'search-index.json' && Array.isArray(data)) {
    return (data as SearchEntry[])
      .map((entry) => ({ ...entry, id: '{id}' }))
      .sort((a, b) => byCodePoint(a.url, b.url))
  }

  if (name === 'manifest.json' && data && typeof data === 'object') {
    const manifest = data as WebpubManifest
    if (Array.isArray(manifest.resources)) {
      manifest.resources = [...manifest.resources].sort((a, b) =>
        byCodePoint(a.href, b.href)
      )
    }
  }

  return data
}

export const sha256 = (data: Buffer): string =>
  crypto.createHash('sha256').update(data).digest('hex')
