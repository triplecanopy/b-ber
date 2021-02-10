import validator from '../src'
import * as mocks from '../__mocks__'
import { flat } from '../src/lib/flat'

const check = text => validator({ text, index: 0 })

describe('b-ber-validator', () => {
  it('parses a block directive', () => {
    const res = check(mocks.test1)
    expect(res.success).toBe(true)
  })

  it('parses content', () => {
    const res = check(mocks.test2)
    expect(res.success).toBe(true)
  })

  it('parses an inline directive', () => {
    const res = check(mocks.test3)
    expect(res.success).toBe(true)
  })

  it('parses block directives', () => {
    const res = check(mocks.test4)
    expect(res.success).toBe(true)
  })

  it('parses inline directives', () => {
    const res = check(mocks.test5)
    expect(res.success).toBe(true)
  })

  it('parses block and inline directives', () => {
    const res = check(mocks.test6)
    expect(res.success).toBe(true)
  })

  it('parses nested block directives', () => {
    const res = check(mocks.test7)
    expect(res.success).toBe(true)
  })

  it('parses nested blocks and inline directives', () => {
    const res = check(mocks.test8)
    expect(res.success).toBe(true)
  })

  it('parses content with nested directives', () => {
    const res1 = check(mocks.test9)
    const res2 = check(mocks.test10)
    expect(res1.success).toBe(true)
    expect(res2.success).toBe(true)
  })

  it('ensures block ids match', () => {
    const res1 = check(mocks.test11)
    const res2 = check(mocks.test12)
    const res3 = check(mocks.test13)
    const res4 = check(mocks.test27)
    const res5 = check(mocks.test30)

    expect(res1.success).toBe(false)
    expect(res2.success).toBe(false)
    expect(res3.success).toBe(false)
    expect(res4.success).toBe(false)
    expect(res5.success).toBe(false)

    expect(res1.expected).toBe(
      'Closing identifier to match opening identifier idA'
    )
    expect(res2.expected).toBe(
      'Closing identifier to match opening identifier idA'
    )
    expect(res3.expected).toBe(
      'Closing identifier to match opening identifier idC'
    )

    // expect(res4.expected).toBe('xxx') // TODO

    expect(res5.expected).toBe(
      'Closing identifier to match opening identifier idA'
    )
  })

  test.todo('ensures attributes error messages are informative')

  it('ensures attributes are well formed', () => {
    const res1 = check(mocks.test14)
    const res2 = check(mocks.test15)
    const res3 = check(mocks.test16)
    const res4 = check(mocks.test17)
    const res5 = check(mocks.test18)
    const res6 = check(mocks.test19)
    const res7 = check(mocks.test20)
    const res8 = check(mocks.test21)
    const res9 = check(mocks.test22)

    expect(res1.success).toBe(false)
    expect(res2.success).toBe(false)
    expect(res3.success).toBe(false)
    expect(res4.success).toBe(false)
    expect(res5.success).toBe(false)
    expect(res6.success).toBe(false)
    expect(res7.success).toBe(false)
    expect(res8.success).toBe(false) // TODO should be success?
    expect(res9.success).toBe(false)

    expect(res1.expected).toBe('Valid directive name')

    // expect(res2.expected).toBe('xxx') // TODO
    // expect(res3.expected).toBe('xxx') // TODO
    // expect(res4.expected).toBe('xxx') // TODO

    expect(res5.expected).toMatch('Closing identifier to match')
    expect(res6.expected).toMatch('Closing identifier to match')

    // expect(res8.expected).toBe('xxx') // TODO
    // expect(res9.expected).toBe('xxx') // TODO
  })

  it('ensures inline directives are well formed', () => {
    const res1 = check(mocks.test23)
    const res2 = check(mocks.test24)
    const res3 = check(mocks.test25)
    const res4 = check(mocks.test26)
    const res5 = check(mocks.test31)

    expect(res1.success).toBe(false)
    expect(res2.success).toBe(false)
    expect(res3.success).toBe(false)
    expect(res4.success).toBe(false)
    expect(res5.success).toBe(true)

    expect(res1.expected).toBe('End of line')
    expect(res2.expected).toBe('Space')
    expect(res3.expected).toBe('::')
    // expect(res4.expected).toBe('xxx') // TODO
  })

  it('parses an empty document', () => {
    const res1 = check(mocks.test28)
    const res2 = check(mocks.test29)

    expect(res1.success).toBe(true)
    expect(res2.success).toBe(true)
  })

  test.todo('parses a gallery directive')
  test.todo('parses a dialogue directive')
})

describe('b-ber-validator/lib/flat', () => {
  beforeAll(() => {
    delete Array.prototype.flat
  })

  it('flattens an array', () => {
    const res = flat([1, [2]])
    expect(res).toEqual([1, 2])
  })

  it('accepts arguments for depth', () => {
    const res1 = flat([1, [2, [3]]], 1)
    const res2 = flat([1, [2, [3]]], 2)

    expect(res1).toEqual([1, 2, [3]])
    expect(res2).toEqual([1, 2, 3])
  })

  test.todo('falls back to the polyfill')
})
