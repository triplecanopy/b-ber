// The dispatcher renders with the table the target names (TASK-164). pdf,
// sample and xml name epub's; there is no fallback for an unlisted target.

import { targets } from '../../../b-ber-lib/src/Target'
import figure from '../../src/figures'
import epub from '../../src/figures/epub'
import mobi from '../../src/figures/mobi'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  get target() {
    return jest
      .requireActual('../../../b-ber-lib/src/Target')
      .getTarget(this.build)
  },
}))

// A landscape image: epub links it to its chapter, mobi does not
const image = {
  id: 'f1',
  ref: 'one',
  source: 'a.jpg',
  alt: 'An image',
  caption: 'A caption',
  classes: '',
  mime: 'image/jpeg',
  width: 400,
  height: 300,
}

describe('figure', () => {
  test("renders with the target's own table", () => {
    expect(figure(image, targets.mobi)).toBe(mobi.landscape(image))
    expect(figure(image, targets.mobi)).not.toBe(epub.landscape(image))
  })

  test.each(['pdf', 'sample', 'xml'])(
    "%s renders with epub's table",
    (name) => {
      expect(figure(image, targets[name])).toBe(epub.landscape(image))
    }
  )
})
