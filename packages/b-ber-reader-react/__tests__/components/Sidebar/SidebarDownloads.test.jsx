/* eslint-disable react/jsx-props-no-spreading */

import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import SidebarDownloads from '../../../src/components/Sidebar/SidebarDownloads'
import { createTestStore } from '../../helpers/store'

describe('SidebarDownloads', () => {
  test('renders null when showSidebar is not "downloads"', () => {
    const store = createTestStore()
    const props = {
      showSidebar: 'chapters',
      downloads: [{ url: '/a.epub', label: 'EPUB' }],
    }

    const { container } = render(
      <Provider store={store}>
        <SidebarDownloads {...props} />
      </Provider>
    )

    expect(container.innerHTML).toBe('')
  })

  test('renders a list of download links, with and without description', () => {
    const store = createTestStore()
    const props = {
      showSidebar: 'downloads',
      downloads: [
        { url: '/book.epub', label: 'EPUB', description: 'EPUB format' },
        { url: '/book.mobi', label: 'MOBI' },
      ],
    }

    const { container, getByText } = render(
      <Provider store={store}>
        <SidebarDownloads {...props} />
      </Provider>
    )

    const links = container.querySelectorAll('a.bber-a')
    expect(links.length).toBe(2)

    expect(getByText('EPUB')).not.toBeNull()
    expect(getByText('EPUB format')).not.toBeNull()
    expect(getByText('MOBI')).not.toBeNull()

    const mobiLink = Array.from(links).find(
      (a) => a.getAttribute('href') === '/book.mobi'
    )
    expect(mobiLink.querySelector('.bber-downloads__description')).toBeNull()
  })

  test('renders via readerSettings.SidebarDownloads override when present', () => {
    const SidebarDownloadsOverride = jest.fn((props) => (
      <div data-testid="custom-downloads">{props.showSidebar}</div>
    ))

    const store = createTestStore({
      readerSettings: { SidebarDownloads: SidebarDownloadsOverride },
    })

    const props = {
      showSidebar: 'downloads',
      downloads: [],
    }

    const { getByTestId } = render(
      <Provider store={store}>
        <SidebarDownloads {...props} />
      </Provider>
    )

    expect(getByTestId('custom-downloads').textContent).toBe('downloads')
    expect(SidebarDownloadsOverride).toHaveBeenCalled()
  })
})
