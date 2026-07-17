import type { CSSProperties } from 'react'
import { transitions } from '../constants'

const styles = ({
  transitionSpeed,
}: {
  transitionSpeed: number
}): Record<string, CSSProperties> => ({
  [transitions.SLIDE]: { transition: `transform ${transitionSpeed}ms ease` },
  [transitions.FADE]: {},
})

export default styles
