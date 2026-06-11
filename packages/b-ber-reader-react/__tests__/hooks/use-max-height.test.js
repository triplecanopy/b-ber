import { act, renderHook } from '@testing-library/react'
import useMaxHeight from '../../src/hooks/use-max-height'

describe('useMaxHeight', () => {
  test('returns a ref callback and a default maxHeight of 0', () => {
    const { result } = renderHook(() => useMaxHeight())

    const [ref, maxHeight] = result.current
    expect(typeof ref).toBe('function')
    expect(maxHeight).toBe(0)
  })

  test('sets maxHeight based on getBoundingClientRect().y and window.innerHeight', () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })

    const { result } = renderHook(() => useMaxHeight())

    const node = {
      getBoundingClientRect: () => ({ y: 100 }),
    }

    act(() => {
      const [ref] = result.current
      ref(node)
    })

    expect(result.current[1]).toBe(700)

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    })
  })

  test('resets maxHeight to 0 when ref is called with null', () => {
    const { result } = renderHook(() => useMaxHeight())

    const node = {
      getBoundingClientRect: () => ({ y: 50 }),
    }

    act(() => {
      const [ref] = result.current
      ref(node)
    })

    expect(result.current[1]).not.toBe(0)

    act(() => {
      const [ref] = result.current
      ref(null)
    })

    expect(result.current[1]).toBe(0)
  })
})
