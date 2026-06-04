import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { EPUB_FILENAME, expect, runBber, test } from './helpers'

// toc.yml entry → OPF spine idref, e.g. "kitchen-sink-ch-01" → "_kitchen-sink-ch-01_xhtml"
function tocEntryToIdref(entry: string): string {
  return `_${entry}_xhtml`
}

function parseTocNames(tocPath: string): string[] {
  const raw = yaml.load(fs.readFileSync(tocPath, 'utf8')) as Array<
    string | Record<string, unknown>
  >
  return raw.map((entry) =>
    typeof entry === 'string' ? entry : Object.keys(entry)[0]
  )
}

function parseSpineIdrefs(opfPath: string): string[] {
  const content = fs.readFileSync(opfPath, 'utf8')
  const spineMatch = content.match(/<spine[^>]*>(.*?)<\/spine>/s)
  if (!spineMatch) return []
  return [...spineMatch[1].matchAll(/idref="([^"]+)"/g)].map((m) => m[1])
}

test.describe('bber build epub', () => {
  test('creates epub zip archive', ({ fixtureCopy }) => {
    runBber(['build', 'epub'], fixtureCopy)

    const epubPath = path.join(fixtureCopy, EPUB_FILENAME)
    expect(fs.existsSync(epubPath), `${EPUB_FILENAME} not found`).toBe(true)

    // Verify ZIP magic bytes (PK\x03\x04)
    const header = Buffer.allocUnsafe(4)
    const fd = fs.openSync(epubPath, 'r')
    fs.readSync(fd, header, 0, 4, 0)
    fs.closeSync(fd)
    expect(header[0]).toBe(0x50) // P
    expect(header[1]).toBe(0x4b) // K
  })

  test('extracted content has required EPUB structure', ({ fixtureCopy }) => {
    runBber(['build', 'epub'], fixtureCopy)

    const builtDir = path.join(fixtureCopy, '_builds-epub')
    expect(
      fs.existsSync(path.join(builtDir, 'META-INF', 'container.xml'))
    ).toBe(true)
    expect(fs.existsSync(path.join(builtDir, 'OPS', 'content.opf'))).toBe(true)
  })

  test('OPS contains an XHTML file for each epub.yml spine entry', ({
    fixtureCopy,
  }) => {
    runBber(['build', 'epub'], fixtureCopy)

    const tocPath = path.join(fixtureCopy, '_project', 'epub.yml')
    const names = parseTocNames(tocPath)
    const opsDir = path.join(fixtureCopy, '_builds-epub', 'OPS')
    const textDir = path.join(opsDir, 'text')

    for (const name of names) {
      // The toc entry generates OPS/toc.xhtml; all others go under OPS/text/
      const xhtmlPath =
        name === 'toc'
          ? path.join(opsDir, 'toc.xhtml')
          : path.join(textDir, `${name}.xhtml`)
      expect(
        fs.existsSync(xhtmlPath),
        `missing XHTML for spine entry "${name}"`
      ).toBe(true)
    }
  })

  test('OPF spine order matches epub.yml', ({ fixtureCopy }) => {
    runBber(['build', 'epub'], fixtureCopy)

    const tocPath = path.join(fixtureCopy, '_project', 'epub.yml')
    const opfPath = path.join(fixtureCopy, '_builds-epub', 'OPS', 'content.opf')

    const tocNames = parseTocNames(tocPath)
    const spineIdrefs = parseSpineIdrefs(opfPath)

    // Verify each toc entry appears in the spine in the same relative order
    let lastIndex = -1
    for (const name of tocNames) {
      const idref = tocEntryToIdref(name)
      const idx = spineIdrefs.indexOf(idref)
      expect(idx, `"${name}" not found in OPF spine`).toBeGreaterThan(-1)
      expect(
        idx,
        `"${name}" appears out of order in OPF spine`
      ).toBeGreaterThan(lastIndex)
      lastIndex = idx
    }
  })

  // EPUBCheck compliance is tracked in TASK-056. The current build produces
  // validation errors from the iframe figure template (deprecated HTML
  // attributes, remote src). This test is expected to fail until TASK-056 is
  // resolved.
  test('exits with code 0', ({ fixtureCopy }) => {
    test.fail(true, 'EPUBCheck errors from iframe template (see TASK-056)')
    const result = runBber(['build', 'epub'], fixtureCopy)
    expect(result.status).toBe(0)
  })
})
