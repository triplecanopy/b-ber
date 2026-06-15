/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'
import SidebarMetadata from '../../../src/components/Sidebar/SidebarMetadata'
import { renderWithStore } from '../../helpers/renderWithStore'

describe('SidebarMetadata', () => {
  test('renders null when showSidebar is not "metadata"', () => {
    const props = {
      showSidebar: 'chapters',
      metadata: { Title: 'My Book' },
    }

    const { container } = renderWithStore(<SidebarMetadata {...props} />)

    expect(container.innerHTML).toBe('')
  })

  test('renders dl/dt/dd entries and skips falsy keys/values', () => {
    const props = {
      showSidebar: 'metadata',
      metadata: {
        Title: 'My Book',
        Author: 'Jane Doe',
        Empty: '',
        '': 'no key',
      },
    }

    const { container, getByText } = renderWithStore(
      <SidebarMetadata {...props} />
    )

    const dl = container.querySelector('dl.bber-dl')
    expect(dl).not.toBeNull()

    expect(getByText('Title')).not.toBeNull()
    expect(getByText('My Book')).not.toBeNull()
    expect(getByText('Author')).not.toBeNull()
    expect(getByText('Jane Doe')).not.toBeNull()

    // Falsy value (Empty) and falsy key ('') should not render dt/dd pairs
    const dts = container.querySelectorAll('dt.bber-dt')
    expect(dts.length).toBe(2)
  })

  test('renders via readerSettings.SidebarMetadata override when present', () => {
    const SidebarMetadataOverride = jest.fn((props) => (
      <div data-testid="custom-metadata">{props.showSidebar}</div>
    ))

    const props = {
      showSidebar: 'metadata',
      metadata: {},
    }

    const { getByTestId } = renderWithStore(<SidebarMetadata {...props} />, {
      overrides: {
        readerSettings: { SidebarMetadata: SidebarMetadataOverride },
      },
    })

    expect(getByTestId('custom-metadata').textContent).toBe('metadata')
    expect(SidebarMetadataOverride).toHaveBeenCalled()
  })
})
