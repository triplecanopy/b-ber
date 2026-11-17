import {
  knownCommand,
  knownFormats,
  noExtraArguments,
} from '../../src/lib/arguments'

describe('knownCommand', () => {
  const check = knownCommand(['build', 'opf'])

  it('passes a registered command', () => {
    expect(check({ _: ['build', 'epub'] })).toBe(true)
  })

  it('leaves no command at all to demandCommand', () => {
    expect(check({ _: [] })).toBe(true)
  })

  it('names a word that is no command', () => {
    expect(check({ _: ['frobnicate'] })).toBe('Unknown command: frobnicate')
  })

  it('names a number, which yargs parses as one', () => {
    expect(check({ _: [5] })).toBe('Unknown command: 5')
  })
})

describe('noExtraArguments', () => {
  it('passes the command name alone', () => {
    expect(noExtraArguments({ _: ['opf'] })).toBe(true)
  })

  it('names one word left over', () => {
    expect(noExtraArguments({ _: ['opf', 'extra'] })).toBe(
      'Unknown argument: extra'
    )
  })

  it('names every word left over', () => {
    expect(noExtraArguments({ _: ['new', 'My', 'Big', 'Project'] })).toBe(
      'Unknown arguments: My, Big, Project'
    )
  })
})

describe('knownFormats', () => {
  const check = knownFormats(['epub', 'web'])

  it('passes no format, which is every format', () => {
    expect(check({ _: ['build'] })).toBe(true)
  })

  it('passes several known formats', () => {
    expect(check({ _: ['build', 'epub', 'web'] })).toBe(true)
  })

  it('names an unknown format', () => {
    expect(check({ _: ['build', 'epub', 'ebup'] })).toBe('Unknown format: ebup')
  })

  it('names every unknown format', () => {
    expect(check({ _: ['build', 'ebup', 'wbe'] })).toBe(
      'Unknown formats: ebup, wbe'
    )
  })
})
