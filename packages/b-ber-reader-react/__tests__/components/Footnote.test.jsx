import { act, fireEvent } from '@testing-library/react'
import React from 'react'
import Footnote from '../../src/components/Footnote'
import * as Request from '../../src/helpers/Request'
import Viewport from '../../src/helpers/Viewport'
import { renderWithStore } from '../helpers/renderWithStore'

// Request is a module of named exports (TASK-103); auto-mock it rather than
// jest.spyOn, since ES-module namespace bindings are non-configurable.
jest.mock('../../src/helpers/Request')

const renderFootnote = ({ href, viewerSettings = {} } = {}) =>
  renderWithStore(
    <Footnote id="fnref1" href={href}>
      1
    </Footnote>,
    { overrides: { viewerSettings } }
  )

describe('Footnote', () => {
  let consoleError
  let consoleWarn

  beforeEach(() => {
    jest.clearAllMocks()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    consoleError.mockRestore()
    consoleWarn.mockRestore()
  })

  test('showFootnote fetches and displays footnote content', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ol id="notes"><li id="fn1"><p>Note text</p></li></ol></body></html>',
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    expect(Request.getText).toHaveBeenCalledWith(
      'https://example.com/notes.html#fn1'
    )

    const body = container.querySelector('.footnote__body')
    expect(body.classList.contains('footnote__body--hidden')).toBe(false)

    // count is injected (start=1, index 0 -> count 1)
    const countNode = container.querySelector('.footnote__content--count')
    expect(countNode).not.toBeNull()
    expect(countNode.textContent).toBe('1')
    expect(container.querySelector('.footnote__content').textContent).toContain(
      'Note text'
    )
  })

  test('toggleFootnote shows then hides the footnote', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ul id="notes"><li id="fn1"><span>Toggle note</span></li></ul></body></html>',
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    let body = container.querySelector('.footnote__body')
    expect(body.classList.contains('footnote__body--hidden')).toBe(false)

    await act(async () => {
      fireEvent.click(number)
    })

    body = container.querySelector('.footnote__body')
    expect(body.classList.contains('footnote__body--hidden')).toBe(true)
  })

  test('logs an error and leaves content empty when the target id is not found', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ul id="notes"><li id="fn-other">Other</li></ul></body></html>',
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    expect(console.error).toHaveBeenCalled()

    const body = container.querySelector('.footnote__body')
    // visible state was never set to true, so the body remains hidden
    expect(body.classList.contains('footnote__body--hidden')).toBe(true)
  })

  test('clicking outside the footnote (handleDocumentClick) hides it', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    expect(
      container
        .querySelector('.footnote__body')
        .classList.contains('footnote__body--hidden')
    ).toBe(false)

    // Click on a non-anchor element outside the footnote
    await act(async () => {
      fireEvent.click(document.body)
    })

    expect(
      container
        .querySelector('.footnote__body')
        .classList.contains('footnote__body--hidden')
    ).toBe(true)
  })

  test('clicking an anchor element does not hide the footnote', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    const anchor = document.createElement('a')
    anchor.href = '#'
    document.body.appendChild(anchor)

    await act(async () => {
      fireEvent.click(anchor)
    })

    expect(
      container
        .querySelector('.footnote__body')
        .classList.contains('footnote__body--hidden')
    ).toBe(false)

    document.body.removeChild(anchor)
  })

  describe('handleOnMouseOver', () => {
    test('toggles footnote when not in single column mode', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.mouseOver(number)
      })

      expect(
        container
          .querySelector('.footnote__body')
          .classList.contains('footnote__body--hidden')
      ).toBe(false)
    })

    test('does nothing when in single column mode', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(true)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.mouseOver(number)
      })

      expect(
        container
          .querySelector('.footnote__body')
          .classList.contains('footnote__body--hidden')
      ).toBe(true)
      expect(Request.getText).not.toHaveBeenCalled()
    })
  })

  describe('handleOnMouseMove', () => {
    test('hides footnote when mouse moves over a different footnote number span', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.click(number)
      })

      expect(
        container
          .querySelector('.footnote__body')
          .classList.contains('footnote__body--hidden')
      ).toBe(false)

      // Simulate hovering over a different footnote's number span
      const otherSpan = document.createElement('span')
      otherSpan.className = 'footnote__number'
      otherSpan.dataset.footnote = 'some-other-id'
      document.body.appendChild(otherSpan)

      await act(async () => {
        fireEvent.mouseMove(otherSpan)
      })

      expect(
        container
          .querySelector('.footnote__body')
          .classList.contains('footnote__body--hidden')
      ).toBe(true)

      document.body.removeChild(otherSpan)
    })

    test('does nothing in single column mode', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(true)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.mouseMove(number)
      })

      // mousemove listener is only bound on showFootnote, which never ran
      // in single column mode, so the body remains hidden
      expect(
        container
          .querySelector('.footnote__body')
          .classList.contains('footnote__body--hidden')
      ).toBe(true)
    })
  })

  describe('footnoteStyles', () => {
    test('single column: width based on window width, left negated and offset by paddingLeft', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(true)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
        viewerSettings: {
          columnWidth: 300,
          columnGap: 20,
          paddingLeft: 10,
          paddingTop: 0,
          paddingBottom: 0,
        },
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.click(number)
      })

      const body = container.querySelector('.footnote__body')
      // jsdom getBoundingClientRect returns all-zero rect -> left = 0
      // single column -> left = (0 * -1) + paddingLeft = 10
      expect(body.style.left).toBe('10px')
      expect(body.style.width).toBe(`${window.innerWidth - 10 * 2}px`)
      expect(body.style.cursor).toBe('auto')
    })

    test('multi column, verso position (left < window center): width is columnWidth + columnGap', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
        viewerSettings: {
          columnWidth: 300,
          columnGap: 20,
          paddingLeft: 10,
          paddingTop: 0,
          paddingBottom: 0,
        },
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.click(number)
      })

      const body = container.querySelector('.footnote__body')
      expect(body.style.width).toBe('320px')
      // jsdom getBoundingClientRect x = 0, which is < window.innerWidth/2
      // -> left = (0 * -1) + paddingLeft = 10
      expect(body.style.left).toBe('10px')
    })

    test('top offset positioning when footnote does not overflow viewport', async () => {
      Request.getText.mockResolvedValue({
        data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
      })
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

      const { container } = renderFootnote({
        href: 'https://example.com/notes.html#fn1',
        viewerSettings: {
          columnWidth: 300,
          columnGap: 20,
          paddingLeft: 10,
          paddingTop: 0,
          paddingBottom: 0,
        },
      })

      const number = container.querySelector('.footnote__number')

      await act(async () => {
        fireEvent.click(number)
      })

      const body = container.querySelector('.footnote__body')
      // getBoundingClientRect().top = 0, offsetHeight = 0, windowHeight - 0 > 0
      // -> aboveElement = false -> offsetProp = 'top'
      expect(body.style.top).toBe('1.5rem')
      expect(body.style.bottom).toBe('')
    })
  })

  test('processAnchorNode removes relative/internal links and marks external links target=_blank', async () => {
    Request.getText.mockResolvedValue({
      data: `<html><body><ul id="notes"><li id="fn1"><div>
        Note text
        <a href="/relative-link">relative</a>
        <a href="https://external.example.com/page">external</a>
        <script>evil()</script>
      </div></li></ul></body></html>`,
    })

    const { container } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    const content = container.querySelector('.footnote__content')

    // relative link removed
    expect(content.querySelector('a[href="/relative-link"]')).toBeNull()
    // script removed (blacklisted node)
    expect(content.querySelector('script')).toBeNull()
    // external link kept, opens in new tab
    const externalLink = content.querySelector(
      'a[href="https://external.example.com/page"]'
    )
    expect(externalLink).not.toBeNull()
    expect(externalLink.getAttribute('target')).toBe('_blank')
  })

  test('componentWillUnmount removes the document click listener', async () => {
    Request.getText.mockResolvedValue({
      data: '<html><body><ul id="notes"><li id="fn1"><span>Note</span></li></ul></body></html>',
    })

    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

    const { container, unmount } = renderFootnote({
      href: 'https://example.com/notes.html#fn1',
    })

    const number = container.querySelector('.footnote__number')

    await act(async () => {
      fireEvent.click(number)
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })
})
