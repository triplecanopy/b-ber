/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react'
import React from 'react'

// These tests call jest.resetModules() so the component re-evaluates its
// module-level browser check (iframePositioningEnabled) under different mocks.
// resetModules() also creates a fresh React copy whose hook dispatcher is null
// at render time — now that Iframe is functional, that crashes on useEffect.
// Pin one React instance (the one RTL renders with) across resets.
jest.mock('react', () => {
  if (!globalThis.__reactSingleton) {
    globalThis.__reactSingleton = jest.requireActual('react')
  }
  return globalThis.__reactSingleton
})

jest.mock(
  '../../../src/lib/with-node-position',
  () => (WrappedComponent) => (props) => <WrappedComponent {...props} />
)

// useIframePosition now supplies the placeholder geometry / style block / ref;
// stub it so these tests stay focused on Iframe's own rendering.
jest.mock('../../../src/hooks/use-iframe-position', () => ({
  __esModule: true,
  default: () => ({
    iframePlaceholderTop: 0,
    iframePlaceholderWidth: 0,
    iframePlaceholderHeight: 0,
    iframeStyleBlock: () => '.iframe { color: red; }',
    innerRef: () => {},
  }),
}))

describe('Iframe', () => {
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('with iframe positioning disabled (default browser detection)', () => {
    test('renders an iframe with the given attrs', async () => {
      const { default: Iframe } = await import(
        '../../../src/components/Media/Iframe'
      )

      const ref = React.createRef()
      const elemRef = React.createRef()

      const attrs = {
        src: 'https://example.com/embed',
        title: 'Example iframe',
        width: '600',
        height: '400',
      }

      const tree = render(
        <Iframe
          attrs={attrs}
          viewerSettings={{}}
          elemRef={elemRef}
          innerRef={ref}
        />
      )

      const iframe = tree.container.querySelector('iframe')

      expect(iframe).not.toBeNull()
      expect(iframe.getAttribute('src')).toBe('https://example.com/embed')
      expect(iframe.getAttribute('title')).toBe('Example iframe')
      expect(iframe.getAttribute('width')).toBe('600')
      expect(iframe.getAttribute('height')).toBe('400')

      // No placeholder/style block when positioning is disabled
      expect(tree.container.querySelector('style')).toBeNull()
      expect(
        tree.container.querySelector('.bber-iframe-placeholder')
      ).toBeNull()
    })

    test('cleans up the blur listener on unmount', async () => {
      const { default: Iframe } = await import(
        '../../../src/components/Media/Iframe'
      )

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const attrs = {
        src: 'https://example.com/embed',
        title: 'Example iframe',
        width: '600',
        height: '400',
      }

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

    test('focusWindow refocuses the window after a blur event', async () => {
      const { default: Iframe } = await import(
        '../../../src/components/Media/Iframe'
      )

      jest.useFakeTimers()

      const focusSpy = jest.spyOn(window, 'focus').mockImplementation(() => {})

      const attrs = {
        src: 'https://example.com/embed',
        title: 'Example iframe',
        width: '600',
        height: '400',
      }

      render(<Iframe attrs={attrs} viewerSettings={{}} />)

      window.dispatchEvent(new Event('blur'))

      jest.runAllTimers()

      expect(focusSpy).toHaveBeenCalled()

      focusSpy.mockRestore()
      jest.useRealTimers()
    })
  })

  describe('with iframe positioning enabled', () => {
    beforeEach(() => {
      jest.doMock('../../../src/helpers/utils', () => {
        const actual = jest.requireActual('../../../src/helpers/utils')
        return { ...actual, isBrowser: () => true }
      })
    })

    test('renders style block and placeholder, mobile layout', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => true },
      }))

      const { default: Iframe } = await import(
        '../../../src/components/Media/Iframe'
      )

      const attrs = {
        src: 'https://example.com/embed',
        title: 'Example iframe',
        width: '600',
        height: '400',
      }

      const tree = render(
        <Iframe attrs={attrs} viewerSettings={{}} elemRef={React.createRef()} />
      )

      expect(tree.container.querySelector('style')).not.toBeNull()
      expect(
        tree.container.querySelector('.bber-iframe-placeholder')
      ).not.toBeNull()

      const iframe = tree.container.querySelector('iframe')
      expect(iframe).not.toBeNull()
    })

    test('renders style block and placeholder, desktop layout', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => false },
      }))

      const { default: Iframe } = await import(
        '../../../src/components/Media/Iframe'
      )

      const attrs = {
        src: 'https://example.com/embed',
        title: 'Example iframe',
        width: '600',
        height: '400',
      }

      const tree = render(
        <Iframe
          attrs={attrs}
          viewerSettings={{}}
          iframePlaceholderTop={50}
          iframePlaceholderWidth={300}
          elemRef={React.createRef()}
        />
      )

      expect(tree.container.querySelector('style')).not.toBeNull()

      const placeholder = tree.container.querySelector(
        '.bber-iframe-placeholder'
      )
      expect(placeholder).not.toBeNull()
      expect(placeholder.classList.contains('bber-iframe-placeholder')).toBe(
        true
      )

      const iframe = tree.container.querySelector('iframe')
      expect(iframe).not.toBeNull()
    })
  })
})
