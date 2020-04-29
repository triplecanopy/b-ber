import { elements, terms } from '../src'

describe('dublin-core', () => {
  it('exports the module', () => {
    expect(elements).toBeArray()
    expect(terms).toBeArray()
  })
})
