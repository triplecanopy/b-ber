import { rand, unlessDefined } from '../../src/helpers/utils'

describe('utils', () => {
  describe('rand', () => {
    it('returns a string', () => {
      expect(typeof rand()).toBe('string')
    })

    it('contains only integers', () => {
      expect(rand()).toMatch(/^\d+$/)
    })

    it('returns a uniqe value', () => {
      const r1 = rand()
      const r2 = rand()
      expect(r1).not.toEqual(r2)
    })
  })

  describe('unlessDefined', () => {
    it('evaluates the arguments', () => {
      expect(unlessDefined(1, 2)).toBe(1)
    })

    it('returns the first non-undefined value', () => {
      expect(unlessDefined(undefined, undefined, false, 2)).toBeFalse()
    })

    it('returns undefined if no arguments are provided', () => {
      expect(unlessDefined(undefined)).toBeUndefined()
    })
  })
})
