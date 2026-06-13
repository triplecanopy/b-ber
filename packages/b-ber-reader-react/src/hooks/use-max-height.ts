import { useCallback, useState } from 'react'

type MaxHeightRef = (node: HTMLElement | null) => void

export default function useMaxHeight(): [MaxHeightRef, number] {
  const defaultHeight = 0
  const [maxHeight, setMaxHeight] = useState(defaultHeight)

  const ref = useCallback<MaxHeightRef>(
    (node) => {
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
