/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'
import SidebarDownloads from '../../../src/components/Sidebar/SidebarDownloads'
import { renderWithStore } from '../../helpers/renderWithStore'

describe('SidebarDownloads', () => {
  test('renders null when showSidebar is not "downloads"', () => {
    const props = {
      showSidebar: 'chapters',
      downloads: [{ url: '/a.epub', label: 'EPUB' }],
    }

    const { container } = renderWithStore(<SidebarDownloads {...props} />)

    expect(container.innerHTML).toBe('')
  })

  test('renders a list of download links, with and without description', () => {
    const props = {
      showSidebar: 'downloads',
      downloads: [
        { url: '/book.epub', label: 'EPUB', description: 'EPUB format' },
        { url: '/book.mobi', label: 'MOBI' },
      ],
    }

    const { container, getByText } = renderWithStore(
      <SidebarDownloads {...props} />
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

    const props = {
      showSidebar: 'downloads',
      downloads: [],
    }

    const { getByTestId } = renderWithStore(<SidebarDownloads {...props} />, {
      overrides: {
        readerSettings: { SidebarDownloads: SidebarDownloadsOverride },
      },
    })

    expect(getByTestId('custom-downloads').textContent).toBe('downloads')
    expect(SidebarDownloadsOverride).toHaveBeenCalled()
  })
})
