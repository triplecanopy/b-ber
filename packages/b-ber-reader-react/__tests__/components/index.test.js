/**
 * Smoke test for src/components/index.js — purely a re-export barrel.
 * Importing it exercises the module for coverage and guards against typos
 * in the re-export paths (a bad path would throw at import time).
 */

import * as components from '../../src/components'

describe('components/index', () => {
  test('re-exports the expected component names', () => {
    const expectedExports = [
      'App',
      'Controls',
      'Footnote',
      'Frame',
      'Layout',
      'Library',
      'Link',
      'Marker',
      'Audio',
      'Iframe',
      'Video',
      'Vimeo',
      'Reader',
      'Spinner',
      'Spread',
      'SpreadFigure',
      'Ultimate',
    ]

    expectedExports.forEach((name) => {
      expect(components[name]).toBeDefined()
    })
  })
})
