import sequences, { build } from '../src/sequences'

describe('sequences', () => {
  it('exports the build list', () => {
    expect(build).toBeArray()
  })
  it('exports the lists of sequences', () => {
    expect(sequences.epub).toEqual([...build, 'epub'])
    expect(sequences.mobi).toEqual([...build, 'mobiCSS', 'mobi'])
    expect(sequences.pdf).toEqual([...build, 'pdf'])
    expect(sequences.web).toEqual([...build, 'web'])
    expect(sequences.sample).toEqual([...build, 'sample'])
    expect(sequences.reader).toEqual([...build, 'reader'])
  })
})
