import createBuildSequence from '../src/create-build-sequence'
import sequences from '../src/sequences'

describe('createBuildSequence', () => {
  it('returns the matching sequences for known formats', () => {
    expect(createBuildSequence(['epub', 'pdf'])).toEqual(['epub', 'pdf'])
  })

  it('filters out unknown formats', () => {
    expect(createBuildSequence(['epub', 'bogus'])).toEqual(['epub'])
  })

  it('returns all formats when none of the desired sequences match', () => {
    expect(createBuildSequence(['bogus'])).toEqual(Object.keys(sequences))
  })

  it('returns all formats when given an empty list', () => {
    expect(createBuildSequence([])).toEqual(Object.keys(sequences))
  })
})
