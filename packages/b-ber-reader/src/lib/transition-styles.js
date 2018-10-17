import { transitions } from '../constants'

const styles = ({ transitionSpeed }) => ({
    [transitions.SLIDE]: { transition: `transform ${transitionSpeed}ms ease` },
    [transitions.FADE]: {},
})

export default styles
