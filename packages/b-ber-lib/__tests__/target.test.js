// The targets and their features (TASK-164). Each feature row is the set of
// targets TASK-160's inventory of `state.build` branches found for it, so a
// change here is a change of output for some target.

import { getTarget, isTargetName, targets } from '../src/Target'

const NAMES = ['epub', 'mobi', 'pdf', 'web', 'reader', 'sample', 'xml']

const having = (predicate) =>
  NAMES.filter((name) => predicate(targets[name].features))

describe('targets', () => {
  it('defines the seven targets, each under its own name', () => {
    expect(Object.keys(targets).sort()).toEqual([...NAMES].sort())
    for (const name of NAMES) expect(targets[name].name).toBe(name)
  })

  it.each([
    ['liveEmbeds', (f) => f.liveEmbeds, ['web', 'reader']],
    ['fullbleedContainers', (f) => f.fullbleedContainers, ['web', 'reader']],
    ["figuresOn: 'titlepage'", (f) => f.figuresOn === 'titlepage', ['reader']],
    ['readerRuntime', (f) => f.readerRuntime, ['reader']],
    ['no nonLinearSpine', (f) => !f.nonLinearSpine, ['mobi']],
    ['no coverPage', (f) => !f.coverPage, ['pdf']],
  ])('%s: %j', (_label, predicate, expected) => {
    expect(having(predicate)).toEqual(expected)
  })

  it('names a figure template table for every target, epub for pdf, sample and xml', () => {
    expect(
      Object.fromEntries(NAMES.map((n) => [n, targets[n].figureTemplates]))
    ).toEqual({
      epub: 'epub',
      mobi: 'mobi',
      pdf: 'epub',
      web: 'web',
      reader: 'reader',
      sample: 'epub',
      xml: 'epub',
    })
  })
})

describe('getTarget', () => {
  it('returns the target of a name', () => {
    expect(getTarget('reader')).toBe(targets.reader)
  })

  it('throws on a name that is not a target', () => {
    expect(() => getTarget('kindle')).toThrow(/Unknown target \[kindle\]/)
    expect(() => getTarget('toString')).toThrow(/Unknown target/)
    expect(isTargetName('constructor')).toBe(false)
  })
})
