/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react'
import React from 'react'
import Iframe from '../../../src/components/Media/Iframe'

// Iframe reads its element ref from useNodePosition; stub it so these tests
// don't need a store / measured viewport.
jest.mock('../../../src/hooks/use-node-position', () => ({
  __esModule: true,
  default: () => ({
    elemRef: { current: null },
    verso: null,
    recto: null,
    spreadIndex: null,
    elementEdgeLeft: null,
    view: {},
    viewerSettings: {},
    readerSettings: {},
  }),
}))

describe('Iframe', () => {
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders an iframe with the given attrs', () => {
    const attrs = {
      src: 'https://example.com/embed',
      title: 'Example iframe',
      width: '600',
      height: '400',
    }

    const tree = render(<Iframe attrs={attrs} viewerSettings={{}} />)

    const iframe = tree.container.querySelector('iframe')

    expect(iframe).not.toBeNull()
    expect(iframe.getAttribute('src')).toBe('https://example.com/embed')
    expect(iframe.getAttribute('title')).toBe('Example iframe')
    expect(iframe.getAttribute('width')).toBe('600')
    expect(iframe.getAttribute('height')).toBe('400')

    // The Chrome-81 placeholder/style block is gone (TASK-102) — embeds render
    // inline in the normal column flow.
    expect(tree.container.querySelector('style')).toBeNull()
    expect(tree.container.querySelector('.bber-iframe-placeholder')).toBeNull()
  })

  test('cleans up the blur listener on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const attrs = { src: 'https://example.com/embed', title: 'Example iframe' }
    const tree = render(<Iframe attrs={attrs} viewerSettings={{}} />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'blur',
      expect.any(Function)
    )

    tree.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'blur',
      expect.any(Function)
    )

    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  test('focusWindow refocuses the window after a blur event', () => {
    jest.useFakeTimers()

    const focusSpy = jest.spyOn(window, 'focus').mockImplementation(() => {})

    const attrs = { src: 'https://example.com/embed', title: 'Example iframe' }
    render(<Iframe attrs={attrs} viewerSettings={{}} />)

    window.dispatchEvent(new Event('blur'))

    jest.runAllTimers()

    expect(focusSpy).toHaveBeenCalled()

    focusSpy.mockRestore()
    jest.useRealTimers()
  })
})
