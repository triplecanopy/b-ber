/* eslint-disable no-continue */
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { connect } from 'react-redux'
// import { debug } from '../config'
// import { isNumeric } from '../helpers/Types'
// import Viewport from '../helpers/Viewport'
// import { SpreadImageStyles } from '.'
import SpreadContext from '../lib/spread-context'

function Spread(props) {
  // constructor(props) {
  //   super(props)

  //   this.state = {
  //     left: '0px',
  //     spreadPosition: 0,
  //     recto: false,
  //     verso: false,
  //     elementEdgeLeft: 0,
  //     unbound: false,
  //   }
  // }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   const markerId = this.props['data-marker-reference']
  //   const marker = nextProps.markers[markerId]

  //   if (!marker) return

  //   const { recto, verso, elementEdgeLeft, unbound } = marker

  //   // TODO most of this state is unused below, it's just being checked against
  //   // to determine if `updateChildElementPositions` should fire
  //   if (
  //     recto !== this.state.recto ||
  //     verso !== this.state.verso ||
  //     elementEdgeLeft !== this.state.elementEdgeLeft ||
  //     unbound !== this.state.unbound
  //   ) {
  //     this.setState(
  //       { recto, verso, elementEdgeLeft, unbound },
  //       this.updateChildElementPositions
  //     )
  //   }
  // }

  // componentDidMount() {
  //   this.updateChildElementPositions()
  // }

  // calculateSpreadOffset = () => {
  //   let { height } = this.props.viewerSettings
  //   const { paddingTop, paddingBottom } = this.props.viewerSettings
  //   const padding = paddingTop + paddingBottom

  //   height = isNumeric(height) ? height * 2 - padding * 2 : height
  //   if (isNumeric(height)) height -= 1 // nudge to prevent overflow onto next spread

  //   this.updateChildElementPositions()
  // }

  // Spread.updateChildElementPositions lays out absolutely positioned images
  // over fullbleed placeholders for FF and Safari. This is Chrome's default
  // behaviour but we update there as well for consistency
  // updateChildElementPositions = () => {
  //   const markerId = this.props['data-marker-reference']
  //   const marker = this.props.markers[markerId]

  //   if (!marker) {
  //     return console.error('Cannot update child positions: No marker')
  //   }

  //   const { /* verso,  recto,*/ elementEdgeLeft, unbound } = marker
  //   // set this after loading to prevent figures drifing around on initial page load
  //   // TODO: should be passing in transition speed
  //   // @issue: https://github.com/triplecanopy/b-ber/issues/216
  //   // const transform = 'transition: transform 400ms ease'
  //   const width = window.innerWidth
  //   const { paddingLeft, paddingRight, columnGap } = this.props.viewerSettings
  //   const layoutWidth = width - paddingLeft - paddingRight + columnGap // not sure why we're adding columnGap in here ...

  //   // const spreadPosition =
  //   //   Math.round((elementEdgeLeft + paddingLeft) / layoutWidth) + 1

  //   const spreadPosition = Math.ceil(elementEdgeLeft / layoutWidth)
  //   // console.log('spreadPosition', elementEdgeLeft / layoutWidth, spreadPosition)

  //   let left = 0
  //   if (!Viewport.isVerticallyScrolling(this.props.readerSettings)) {
  //     left = layoutWidth * spreadPosition
  //     // if (recto) left -= layoutWidth
  //     if (unbound) left = 0
  //   } else {
  //     // left = 0
  //   }

  //   left = `${left}px`

  //   this.setState({ left, spreadPosition })
  // }

  // render() {
  // const { left } = this.state
  // const markerId = this.props['data-marker-reference']
  // const marker = this.props.markers[markerId]
  // if (!marker) return null

  // const { spreadPosition } = this.state
  // const { recto, unbound /*, elementEdgeLeft */ } = marker
  // const { paddingLeft } = this.props.viewerSettings
  // const { layout } = this.props.readerSettings

  // // TODO removing HTML attrs from props
  // // eslint-disable-next-line no-unused-vars
  // const { viewerSettings, readerSettings, markers, ...rest } = this.props

  // const debugStyles = { background: 'blue' }

  // console.log('this.props', this.props)

  // let styles = {}
  // if (debug) styles = { ...styles, ...debugStyles }

  // return (
  //   // eslint-disable-next-line react/jsx-props-no-spreading
  //   <div {...rest} id={`spread__${markerId}`} style={styles}>
  //     <SpreadImageStyles
  //       recto={recto}
  //       markerRefId={markerId}
  //       spreadPosition={spreadPosition}
  //       paddingLeft={paddingLeft}
  //       unbound={unbound}
  //       layout={layout}
  //       // markerX={elementEdgeLeft}
  //     />

  //     {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
  //     <SpreadContext.Provider value={{ left, layout }}>
  //       {this.props.children}
  //     </SpreadContext.Provider>
  //   </div>
  // )

  // console.log(this.props)

  // const { recto } = marker // This is incorrectly calculated

  const node = useRef(null)

  const [verso, setVerso] = useState(true)
  const [offset, setOffset] = useState(0)

  const id = useMemo(() => (Math.random() + 1).toString(36).substring(7), [])
  const spreadContextValue = useMemo(() => ({ layout: props.layout }), [
    props.layout,
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      const nextOffset =
        (node.current.offsetLeft - props.viewerSettings.paddingLeft) /
        (window.innerWidth -
          props.viewerSettings.paddingLeft -
          props.viewerSettings.paddingRight +
          props.viewerSettings.columnGap)

      setOffset(nextOffset)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useLayoutEffect(() => {
    const nextVerso = offset === 0 || offset % 1 === 0

    // console.log('offset', offset)
    // console.log('verso', id, nextVerso)

    setVerso(nextVerso)
  }, [offset])

  const {
    height: windowHeight,
    paddingTop,
    paddingBottom,
  } = props.viewerSettings
  const multiplier = verso ? 2 : 3
  const height = (windowHeight - paddingTop - paddingBottom) * multiplier

  return (
    <div
      id={id}
      ref={node}
      style={{ height }}
      className={`c-spread c-spread-${verso ? 'verso' : 'recto'}`}
    >
      {/* {props.children} */}

      <SpreadContext.Provider value={spreadContextValue}>
        {props.children}
      </SpreadContext.Provider>
    </div>
  )
  // }
}

export default connect(
  ({ readerSettings, viewerSettings, markers }) => ({
    readerSettings,
    viewerSettings,
    markers,
  }),
  () => ({})
)(Spread)
