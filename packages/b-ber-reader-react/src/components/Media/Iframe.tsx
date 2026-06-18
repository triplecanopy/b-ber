import React, { useEffect } from 'react'
import useNodePosition from '../../hooks/use-node-position'

interface IframeAttrs {
  src?: string
  title?: string
  width?: string | number
  height?: string | number
  [key: string]: any
}

interface IframeProps {
  attrs: IframeAttrs
  // Per-instance override for the node-position calc (set by process-nodes for
  // spread-nested embeds); forwarded to useNodePosition.
  useElementOffsetLeft?: boolean
  layout?: string
  [key: string]: any
}

function Iframe(props: IframeProps) {
  const { attrs } = props

  const node = useNodePosition<HTMLDivElement>({
    useElementOffsetLeft: props.useElementOffsetLeft,
  })

  // Prevent iframe from stealing focus
  useEffect(() => {
    const focusWindow = () => setTimeout(() => window.focus(), 60)

    window.addEventListener('blur', focusWindow)
    return () => window.removeEventListener('blur', focusWindow)
  }, [])

  const { src, title } = attrs

  return (
    <div key={src} ref={node.elemRef}>
      <iframe src={src} title={title} {...attrs} />
    </div>
  )
}

export default Iframe
