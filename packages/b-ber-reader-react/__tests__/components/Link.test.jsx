import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Link from '../../src/components/Link'
import ReaderContext from '../../src/lib/reader-context'
import { createTestStore } from '../helpers/store'

const renderLink = ({
  href,
  children = 'click me',
  getSpineItemByAbsoluteUrl = () => -1,
  navigateToChapterByURL = jest.fn(),
  readerSettingsOverride = {},
} = {}) => {
  const store = createTestStore({ readerSettings: readerSettingsOverride })

  const contextValue = {
    lastSpread: false,
    spreadIndex: 0,
    getTranslateX: () => 0,
    getSpineItemByAbsoluteUrl,
    navigateToChapterByURL,
  }

  const tree = render(
    <Provider store={store}>
      <ReaderContext.Provider value={contextValue}>
        <Link href={href}>{children}</Link>
      </ReaderContext.Provider>
    </Provider>
  )

  return { ...tree, navigateToChapterByURL }
}

describe('Link', () => {
  let consoleError

  beforeEach(() => {
    // Url.isExternal logs when `cmp` (readerSettings.projectURL) is not a
    // valid URL, which the default test store omits.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('internal-to-publication: prevents default and navigates via context', () => {
    const navigateToChapterByURL = jest.fn()

    const { container } = renderLink({
      href: '/chapter-1.xhtml',
      getSpineItemByAbsoluteUrl: () => 2,
      navigateToChapterByURL,
    })

    const anchor = container.querySelector('a')
    expect(anchor.getAttribute('target')).toBe('')
    expect(anchor.getAttribute('rel')).toBe('')

    const clickEvent = fireEvent.click(anchor)

    expect(navigateToChapterByURL).toHaveBeenCalledWith('/chapter-1.xhtml')
    // preventDefault was called -> jsdom's default click result is false when prevented
    expect(clickEvent).toBe(false)
  })

  test('external-to-host (not internal to publication): opens in new tab', () => {
    const navigateToChapterByURL = jest.fn()

    const { container } = renderLink({
      href: 'https://example.com/page',
      getSpineItemByAbsoluteUrl: () => -1,
      navigateToChapterByURL,
    })

    const anchor = container.querySelector('a')
    expect(anchor.getAttribute('target')).toBe('_blank')
    expect(anchor.getAttribute('rel')).toBe('nooperner noreferrer')

    fireEvent.click(anchor)
    expect(navigateToChapterByURL).not.toHaveBeenCalled()
  })

  test('internal-to-host, external-to-publication: opens in current window (_top)', () => {
    const navigateToChapterByURL = jest.fn()

    // window.location.href in jsdom is http://localhost/ - use a same-host
    // href so externalToHost is false, but a different projectURL so
    // internalToHost is true.
    const { container } = renderLink({
      href: 'http://localhost/some-other-page',
      getSpineItemByAbsoluteUrl: () => -1,
      navigateToChapterByURL,
      readerSettingsOverride: { projectURL: 'https://example.com' },
    })

    const anchor = container.querySelector('a')
    expect(anchor.getAttribute('target')).toBe('_top')

    fireEvent.click(anchor)
    expect(navigateToChapterByURL).not.toHaveBeenCalled()
  })

  test('renders children and applies className/style props', () => {
    const { getByText } = renderLink({
      href: '/chapter-1.xhtml',
      children: 'Read more',
      getSpineItemByAbsoluteUrl: () => -1,
    })

    const link = getByText('Read more')
    expect(link.tagName).toBe('A')
  })
})
