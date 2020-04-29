import { isNumeric, isInt, isFloat } from '../../src/helpers/Types'

describe('Types', () => {
  test('is numeric', done => {
    expect(isNumeric('1')).toBe(false)
    expect(isNumeric('')).toBe(false)
    expect(isNumeric(Infinity)).toBe(false)
    expect(isNumeric(-Infinity)).toBe(false)
    expect(isNumeric([])).toBe(false)
    expect(isNumeric(![])).toBe(false)
    expect(isNumeric(null)).toBe(false)

    expect(isNumeric(+'1')).toBe(true)
    expect(isNumeric(3e9)).toBe(true)
    expect(isNumeric(1.1)).toBe(true)
    expect(isNumeric(-2)).toBe(true)
    expect(isNumeric(-0)).toBe(true)

    done()
  })

  test('is an integer', done => {
    expect(isInt(2.1)).toBe(false)
    expect(isInt(21)).toBe(true)
    done()
  })

  test('is a float', done => {
    expect(isFloat(2.1)).toBe(true)
    expect(isFloat(21)).toBe(false)
    done()
  })
})
