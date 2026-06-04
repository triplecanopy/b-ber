import fs from 'node:fs'
import path from 'node:path'
import { expect, runBber, test } from './helpers'

test.describe('bber build reader', () => {
  test('exits with code 0', ({ fixtureCopy }) => {
    const result = runBber(['build', 'reader'], fixtureCopy)
    expect(result.status, result.stderr).toBe(0)
  })

  test('creates _builds-reader directory with manifest.json', ({
    fixtureCopy,
  }) => {
    runBber(['build', 'reader'], fixtureCopy)

    const readerDir = path.join(fixtureCopy, '_builds-reader')
    expect(fs.existsSync(readerDir)).toBe(true)
    expect(fs.existsSync(path.join(readerDir, 'manifest.json'))).toBe(true)
  })

  test('manifest.json has readingOrder array', ({ fixtureCopy }) => {
    runBber(['build', 'reader'], fixtureCopy)

    const manifestPath = path.join(
      fixtureCopy,
      '_builds-reader',
      'manifest.json'
    )
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(Array.isArray(manifest.readingOrder)).toBe(true)
    expect(manifest.readingOrder.length).toBeGreaterThan(0)
  })

  test('epub directory contains at least one XHTML file', ({ fixtureCopy }) => {
    runBber(['build', 'reader'], fixtureCopy)

    const epubTextDir = path.join(
      fixtureCopy,
      '_builds-reader',
      'epub',
      'kitchen-sink-b-ber-fixture-001',
      'OPS',
      'text'
    )
    expect(fs.existsSync(epubTextDir)).toBe(true)
    const xhtmlFiles = fs
      .readdirSync(epubTextDir)
      .filter((f) => f.endsWith('.xhtml'))
    expect(xhtmlFiles.length).toBeGreaterThan(0)
  })

  test('epub directory contains at least one CSS file', ({ fixtureCopy }) => {
    runBber(['build', 'reader'], fixtureCopy)

    const stylesheetsDir = path.join(
      fixtureCopy,
      '_builds-reader',
      'epub',
      'kitchen-sink-b-ber-fixture-001',
      'OPS',
      'stylesheets'
    )
    expect(fs.existsSync(stylesheetsDir)).toBe(true)
    const cssFiles = fs
      .readdirSync(stylesheetsDir)
      .filter((f) => f.endsWith('.css'))
    expect(cssFiles.length).toBeGreaterThan(0)
  })
})
