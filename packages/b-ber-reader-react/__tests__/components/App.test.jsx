/**
 * Tests for App.jsx — the top-level orchestrator that fetches the manifest
 * (and/or book list), derives bookURL/projectURL, dispatches readerSettings
 * updates, and conditionally renders <Reader>.
 *
 * Strategy: Request (Request.getJson / Request.getBooks) is mocked so we can
 * control the manifest/books responses without network access. ./Reader is
 * mocked as a simple placeholder so this is a test of App's orchestration
 * logic (UNSAFE_componentWillMount branches + render guard), not the full
 * Reader tree.
 */

import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import App from '../../src/components/App'
import Request from '../../src/helpers/Request'
import { createTestStore } from '../helpers/store'

jest.mock('../../src/helpers/Request')

jest.mock('../../src/components/Reader', () => {
  return function Reader(props) {
    return <div data-testid="reader" data-book-url={props.bookURL} />
  }
})

describe('App', () => {
  let consoleErrorSpy
  let consoleWarnSpy

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    Request.getBooks.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    jest.clearAllMocks()
  })

  function renderApp(overrides = {}) {
    const store = createTestStore(overrides)
    const utils = render(
      <Provider store={store}>
        <App />
      </Provider>
    )
    return { store, ...utils }
  }

  test('manifestURL + bookURL both set logs an error but continues', async () => {
    const { store, findByTestId } = renderApp({
      readerSettings: {
        manifestURL: 'https://example.com/manifest.json',
        bookURL: 'https://example.com/book/OPS',
      },
    })

    await findByTestId('reader')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Multiple endpoints. Specify either `manifestURL` or `bookURL`'
    )

    expect(store.getState().readerLocation.searchParams).not.toBeUndefined()
  })

  test('manifestURL fetch success derives bookURL/projectURL and dispatches updateSettings', async () => {
    Request.getJson.mockResolvedValue({
      data: {
        resources: [
          {
            type: 'application/oebps-package+xml',
            href: 'https://example.com/book-slug/OPS/content.opf',
          },
        ],
      },
    })

    const { store, findByTestId } = renderApp({
      readerSettings: {
        manifestURL: 'https://example.com/book-slug/manifest.json',
      },
    })

    const reader = await findByTestId('reader')

    expect(Request.getJson).toHaveBeenCalledWith(
      'https://example.com/book-slug/manifest.json'
    )

    // bookURL derived from opfURL by stripping the last two path segments
    // (OPS/content.opf)
    expect(store.getState().readerSettings.bookURL).toBe(
      'https://example.com/book-slug'
    )
    expect(reader.dataset.bookUrl).toBe('https://example.com/book-slug')

    // projectURL falls back to the manifestURL's directory
    expect(store.getState().readerSettings.projectURL).toBe(
      'https://example.com/book-slug'
    )

    expect(store.getState().readerSettings.layout).toBe('columns')
  })

  test('manifestURL fetch failure logs and continues with empty bookURL', async () => {
    Request.getJson.mockRejectedValue(new Error('network error'))

    const { store } = renderApp({
      readerSettings: {
        manifestURL: 'https://example.com/manifest.json',
      },
    })

    // Allow the async componentWillMount to settle
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading Webpub manifest',
      expect.any(Error)
    )

    // bookURL was never set, so render() returns null (no `reader` testid)
    expect(store.getState().readerSettings.bookURL).toBe('')
  })

  test('Request.getBooks success applies matching book config and renders Reader', async () => {
    Request.getBooks.mockResolvedValue({
      data: [
        {
          // id matches the last path segment of bookURL (`OPS`)
          id: 'OPS',
          layout: 'scroll',
          downloads: ['a.epub'],
          ui_options: { navigation: { footer_icons: { page: false } } },
        },
      ],
    })

    const { store, findByTestId } = renderApp({
      readerSettings: {
        bookURL: 'https://example.com/book-slug/OPS',
      },
    })

    await findByTestId('reader')

    const { readerSettings } = store.getState()
    expect(readerSettings.layout).toBe('scroll')
    expect(readerSettings.downloads).toEqual(['a.epub'])
    expect(readerSettings.uiOptions).toEqual({
      navigation: { footer_icons: { page: false } },
    })
    expect(readerSettings.projectURL).toBe('https://example.com')
  })

  test('Request.getBooks failure logs a warning and continues with empty books', async () => {
    Request.getBooks.mockRejectedValue(new Error('api down'))

    const { store, findByTestId } = renderApp({
      readerSettings: {
        bookURL: 'https://example.com/book-slug/OPS',
      },
    })

    await findByTestId('reader')

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Could not load books from API',
      expect.any(Error)
    )
    expect(store.getState().readerSettings.books).toEqual([])

    // No matching book + no readerSettings.layout -> defaults to 'columns'
    expect(store.getState().readerSettings.layout).toBe('columns')
  })

  test('readerSettings.layout overrides the API/default layout when set', async () => {
    Request.getBooks.mockResolvedValue({
      data: [{ id: 'book-slug', layout: 'scroll' }],
    })

    const { store, findByTestId } = renderApp({
      readerSettings: {
        bookURL: 'https://example.com/book-slug/OPS',
        layout: 'columns',
      },
    })

    await findByTestId('reader')

    expect(store.getState().readerSettings.layout).toBe('columns')
  })

  test('render returns null when bookURL is not set (no manifestURL/bookURL provided)', async () => {
    const { container } = renderApp()

    // Allow componentWillMount to settle
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(container.innerHTML).toBe('')
  })

  test('disableBodyStyles defaults to applying body styles', async () => {
    document.body.style.margin = '10px'

    const { findByTestId } = renderApp({
      readerSettings: {
        bookURL: 'https://example.com/book-slug/OPS',
      },
    })

    await findByTestId('reader')

    expect(document.body.style.margin).toBe('0px')
    expect(document.body.style.padding).toBe('0px')
  })

  test('disableBodyStyles=true skips body style mutation', async () => {
    document.body.style.margin = '10px'

    const { findByTestId } = renderApp({
      readerSettings: {
        bookURL: 'https://example.com/book-slug/OPS',
        disableBodyStyles: true,
      },
    })

    await findByTestId('reader')

    expect(document.body.style.margin).toBe('10px')

    // cleanup
    document.body.style.margin = ''
  })
})
