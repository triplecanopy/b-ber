import { useCallback, useState } from 'react'

export default function useMaxHeight() {
  const defaultHeight = 0
  const [maxHeight, setMaxHeight] = useState(defaultHeight)

  const ref = useCallback(
    node => {
      if (node === null) {
        setMaxHeight(defaultHeight)
        return
      }

      const { y } = node.getBoundingClientRect()
      setMaxHeight(window.innerHeight - y)
    },
    [window.innerHeight]
  )

  return [ref, maxHeight]
}
