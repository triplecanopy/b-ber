import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { connect } from 'react-redux'
import SpreadContext from '../lib/spread-context'

function Spread(props) {
  const node = useRef(null)

  const [verso, setVerso] = useState(true)
  const [left, setLeft] = useState(0)
  const [offset, setOffset] = useState(0)
  const [multiplier, setMultiplier] = useState(0)

  const id = useMemo(() => (Math.random() + 1).toString(36).substring(7), [])

  useEffect(() => {
    const updatePosition = () => {
      const nextLeft = node.current.offsetLeft
      const nextOffset =
        (nextLeft - props.viewerSettings.paddingLeft) /
        (window.innerWidth -
          props.viewerSettings.paddingLeft -
          props.viewerSettings.paddingRight +
          props.viewerSettings.columnGap)

      setLeft(nextLeft)
      setOffset(nextOffset)
    }

    const timer = setInterval(updatePosition, 1000)
    updatePosition()

    return () => clearInterval(timer)
  }, [
    props.viewerSettings.paddingLeft,
    props.viewerSettings.paddingRight,
    props.viewerSettings.columnGap,
  ])

  useLayoutEffect(() => {
    const nextVerso = offset === 0 || offset % 1 === 0
    const nextMultiplier = nextVerso ? 2 : 3

    setVerso(nextVerso)
    setMultiplier(nextMultiplier)
  }, [offset])

  const spreadContextValue = useMemo(
    () => ({
      left:
        left +
        (verso
          ? 0
          : window.innerWidth * 0.5 -
            props.viewerSettings.paddingLeft +
            props.viewerSettings.columnGap / 2) -
        props.viewerSettings.paddingLeft,
      layout: props.layout,
    }),
    [left, verso, props.viewerSettings.paddingLeft, props.layout]
  )

  const {
    height: windowHeight,
    paddingTop,
    paddingBottom,
  } = props.viewerSettings

  const height = (windowHeight - paddingTop - paddingBottom) * multiplier

  return (
    <div
      id={id}
      ref={node}
      style={{ height }}
      className={`bber-spread bber-spread-${verso ? 'verso' : 'recto'}`}
    >
      <SpreadContext.Provider value={spreadContextValue}>
        {props.children}
      </SpreadContext.Provider>
    </div>
  )
}

export default connect(
  ({ readerSettings, viewerSettings, markers }) => ({
    readerSettings,
    viewerSettings,
    markers,
  }),
  () => ({})
)(Spread)
