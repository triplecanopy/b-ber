/**
 * Tests for Controls.jsx — the keyboard/click event layer that wraps
 * NavigationHeader/NavigationFooter and wires document-level listeners for
 * page navigation (arrow keys), sidebar dismissal (ESC / outside click),
 * and printing (Cmd+P).
 *
 * Strategy: NavigationHeader/NavigationFooter are mocked as simple
 * placeholders so this is a test of Controls' event-handling logic, not the
 * full navigation UI. useNavigationActions runs for real against the test
 * store.
 */

import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Controls from '../../src/components/Controls'
import { createTestStore } from '../helpers/store'

jest.mock('../../src/components/Navigation', () => ({
  NavigationHeader: function NavigationHeader() {
    return <div data-testid="nav-header" />
  },
  NavigationFooter: function NavigationFooter() {
    return <div data-testid="nav-footer" />
  },
}))

function renderControls(props = {}, overrides = {}) {
  const store = createTestStore(overrides)
  const handlePageNavigation = jest.fn()
  const handleSidebarButtonClick = jest.fn()
  const handleChapterNavigation = jest.fn()
  const navigateToChapterByURL = jest.fn()
  const destroyReaderComponent = jest.fn()

  const defaultProps = {
    spine: [],
    currentSpineItemIndex: 0,
    layout: 'columns',
    metadata: {},
    showSidebar: null,
    spreadIndex: 0,
    lastSpreadIndex: 0,
    downloads: [],
    uiOptions: {},
    handlePageNavigation,
    handleSidebarButtonClick,
    handleChapterNavigation,
    navigateToChapterByURL,
    destroyReaderComponent,
    ...props,
  }

  const utils = render(
    <Provider store={store}>
      <Controls {...defaultProps} />
    </Provider>
  )

  return {
    store,
    handlePageNavigation,
    handleSidebarButtonClick,
    handleChapterNavigation,
    navigateToChapterByURL,
    destroyReaderComponent,
    ...utils,
  }
}

describe('Controls', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders NavigationHeader, children, and NavigationFooter', () => {
    const { getByTestId, getByText } = renderControls({
      children: <div>book content</div>,
    })

    expect(getByTestId('nav-header')).toBeTruthy()
    expect(getByTestId('nav-footer')).toBeTruthy()
    expect(getByText('book content')).toBeTruthy()
  })

  describe('keydown handling when handleEvents is true', () => {
    function setup(props = {}) {
      return renderControls(props, {
        userInterface: { handleEvents: true },
      })
    }

    test('ArrowLeft navigates to the previous page and closes the sidebar', () => {
      const { handlePageNavigation, handleSidebarButtonClick, store } = setup()

      fireEvent.keyDown(document, { which: 37 })

      expect(store.getState().userInterface.enableTransitions).toBe(true)
      expect(handlePageNavigation).toHaveBeenCalledWith(-1)
      expect(handleSidebarButtonClick).toHaveBeenCalledWith(null)
    })

    test('ArrowRight navigates to the next page and closes the sidebar', () => {
      const { handlePageNavigation, handleSidebarButtonClick, store } = setup()

      fireEvent.keyDown(document, { which: 39 })

      expect(store.getState().userInterface.enableTransitions).toBe(true)
      expect(handlePageNavigation).toHaveBeenCalledWith(1)
      expect(handleSidebarButtonClick).toHaveBeenCalledWith(null)
    })

    test('ESC closes the sidebar', () => {
      const { handleSidebarButtonClick } = setup()

      fireEvent.keyDown(document, { which: 27 })

      expect(handleSidebarButtonClick).toHaveBeenCalledWith(null)
    })

    test('Cmd+P triggers window.print and prevents default', () => {
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
      setup()

      fireEvent.keyDown(document, { which: 80, metaKey: true })

      expect(printSpy).toHaveBeenCalledTimes(1)
    })

    test('P without metaKey does not trigger print', () => {
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
      setup()

      fireEvent.keyDown(document, { which: 80, metaKey: false })

      expect(printSpy).not.toHaveBeenCalled()
    })

    test('unrecognized key does nothing', () => {
      const { handlePageNavigation, handleSidebarButtonClick } = setup()

      fireEvent.keyDown(document, { which: 65 })

      expect(handlePageNavigation).not.toHaveBeenCalled()
      expect(handleSidebarButtonClick).not.toHaveBeenCalled()
    })

    test('event with no `which` property is ignored', () => {
      const { handlePageNavigation } = setup()

      fireEvent.keyDown(document, {})

      expect(handlePageNavigation).not.toHaveBeenCalled()
    })
  })

  describe('keydown handling when handleEvents is false', () => {
    test('ArrowLeft does not navigate', () => {
      const { handlePageNavigation, handleSidebarButtonClick, store } =
        renderControls({}, { userInterface: { handleEvents: false } })

      fireEvent.keyDown(document, { which: 37 })

      expect(store.getState().userInterface.enableTransitions).not.toBe(true)
      expect(handlePageNavigation).not.toHaveBeenCalled()
      expect(handleSidebarButtonClick).not.toHaveBeenCalled()
    })
  })

  describe('outside click handling', () => {
    test('click outside sidebar/nav-button closes the sidebar when showSidebar is set', () => {
      const { handleSidebarButtonClick, container } = renderControls(
        { showSidebar: 'chapters' },
        { userInterface: { handleEvents: true } }
      )

      // Click on an element that's not inside .bber-controls__sidebar or
      // .bber-nav__button
      fireEvent.click(container)

      expect(handleSidebarButtonClick).toHaveBeenCalledWith(null)
    })

    test('click inside .bber-controls__sidebar does not close the sidebar', () => {
      const { handleSidebarButtonClick, container } = renderControls(
        { showSidebar: 'chapters' },
        { userInterface: { handleEvents: true } }
      )

      const sidebar = document.createElement('div')
      sidebar.className = 'bber-controls__sidebar'
      const inner = document.createElement('span')
      sidebar.appendChild(inner)
      container.appendChild(sidebar)

      fireEvent.click(inner)

      expect(handleSidebarButtonClick).not.toHaveBeenCalled()
    })

    test('click does nothing when showSidebar is not set', () => {
      const { handleSidebarButtonClick, container } = renderControls(
        { showSidebar: null },
        { userInterface: { handleEvents: true } }
      )

      fireEvent.click(container)

      expect(handleSidebarButtonClick).not.toHaveBeenCalled()
    })

    test('click does nothing when handleEvents is false', () => {
      const { handleSidebarButtonClick, container } = renderControls(
        { showSidebar: 'chapters' },
        { userInterface: { handleEvents: false } }
      )

      fireEvent.click(container)

      expect(handleSidebarButtonClick).not.toHaveBeenCalled()
    })

    test('touchstart triggers the same outside-click handling', () => {
      const { handleSidebarButtonClick, container } = renderControls(
        { showSidebar: 'chapters' },
        { userInterface: { handleEvents: true } }
      )

      fireEvent.touchStart(container)

      expect(handleSidebarButtonClick).toHaveBeenCalledWith(null)
    })
  })

  test('event listeners are removed on unmount', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener')
    const { unmount } = renderControls()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
  })

  test('renders custom NavigationHeader/NavigationFooter from readerSettings', () => {
    const CustomHeader = () => <div data-testid="custom-header" />
    const CustomFooter = () => <div data-testid="custom-footer" />

    const { getByTestId } = renderControls(
      {},
      {
        readerSettings: {
          NavigationHeader: CustomHeader,
          NavigationFooter: CustomFooter,
        },
      }
    )

    expect(getByTestId('custom-header')).toBeTruthy()
    expect(getByTestId('custom-footer')).toBeTruthy()
  })
})
