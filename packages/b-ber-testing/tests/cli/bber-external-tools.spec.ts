import { expect, isInPath, runBber, test } from './helpers'

// These tests verify graceful handling when external tools are unavailable.
// They do NOT assert that the builds succeed end-to-end when the tools ARE
// present — mobi and pdf builds have their own integration concerns.

test.describe('bber build — external tool skip logic', () => {
  test('bber build pdf does not crash when wkhtmltopdf is absent', ({
    fixtureCopy,
  }) => {
    test.skip(
      isInPath('wkhtmltopdf'),
      'wkhtmltopdf is present; skip absence test'
    )
    const result = runBber(['build', 'pdf'], fixtureCopy)
    // Process must exit (not hang), and must not be killed by a signal
    expect(result.status).not.toBeNull()
    expect(result.signal).toBeNull()
  })

  test('bber build mobi does not crash when ebook-convert is absent', ({
    fixtureCopy,
  }) => {
    test.skip(
      isInPath('ebook-convert'),
      'ebook-convert is present; skip absence test'
    )
    const result = runBber(['build', 'mobi'], fixtureCopy)
    expect(result.status).not.toBeNull()
    expect(result.signal).toBeNull()
  })
})
