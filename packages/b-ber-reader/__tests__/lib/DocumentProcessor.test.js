/* global jest,test,expect */

import DocumentProcessor from '../../src/lib/DocumentProcessor'

const errorHtml = `<!doctype html>
<html>
<head/>
<body>
<div data-marker="1"></div>
</body>
</html>`

test('injects markup', done => {
  const processor = new DocumentProcessor()
  const html = `<!doctype html>
    <html>
    <head/>
    <body>
    <div></div>
    <section class="figure__inline figure__large figure__fullbleed"></section>
    </body>
    </html>`

  processor.parseXML(html, (err, result) => {
    const { xml, doc } = result
    expect(err).toBe(null)
    expect(typeof xml).toBe('string')

    const markers = doc.querySelectorAll('[data-marker]')
    const refs = doc.querySelectorAll('[data-marker-reference]')

    expect(markers.length).toBeGreaterThan(0)
    expect(refs.length).toBeGreaterThan(0)

    done()
  })
})

test('catches errors', done => {
  console.assert = jest.fn()
  const processor = new DocumentProcessor()
  const html = errorHtml

  processor.parseXML(html, err => {
    expect(err).toBeInstanceOf(Error)
    done()
  })
})

test('asserts validity', done => {
  console.assert = jest.fn()
  const processor = new DocumentProcessor()
  const html = errorHtml

  processor.parseXML(html, () => {
    expect(console.assert).toHaveBeenCalledTimes(3)
    done()
  })
})

test('validates a document', done => {
  const processor = new DocumentProcessor()
  const parser = new window.DOMParser()
  const html = `<!doctype html>
    <html>
    <head/>
    <body>
    <div data-marker="1"></div>
    <div data-marker="2"></div>
    <div data-marker-reference="1"></div>
    <div data-marker-reference="2"></div>
    </body>
    </html>`

  const doc = parser.parseFromString(html, 'text/html')
  expect(processor.validateDocument(doc)).toBe(true)

  const marker = doc.querySelector('[data-marker="1"]')
  marker.parentNode.removeChild(marker)
  expect(processor.validateDocument(doc)).toBe(false)

  done()
})
