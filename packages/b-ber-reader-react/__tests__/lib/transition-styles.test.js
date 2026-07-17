import { transitions } from '../../src/constants'
import styles from '../../src/lib/transition-styles'

test('returns transition styles keyed by transition type', () => {
  const result = styles({ transitionSpeed: 300 })

  expect(result[transitions.SLIDE]).toEqual({
    transition: 'transform 300ms ease',
  })
  expect(result[transitions.FADE]).toEqual({})
})
