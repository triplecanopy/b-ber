/* eslint-disable react/jsx-props-no-spreading */

import { fireEvent } from '@testing-library/react'
import React from 'react'
import SidebarChapters from '../../../src/components/Sidebar/SidebarChapters'
import { renderWithStore } from '../../helpers/renderWithStore'

const buildSpine = () => [
  {
    id: 'ch1',
    title: 'Chapter One',
    absoluteURL: '/ch1',
    depth: 0,
    inTOC: true,
    children: [
      {
        id: 'ch1-1',
        title: 'Chapter One Sub',
        absoluteURL: '/ch1-1',
        depth: 1,
        inTOC: true,
        children: [],
      },
    ],
  },
  {
    id: 'ch2',
    title: '',
    absoluteURL: '/ch2',
    depth: 0,
    inTOC: true,
    children: [],
  },
  {
    id: 'ch3',
    title: 'Hidden',
    absoluteURL: '/ch3',
    depth: 0,
    inTOC: false,
    children: [],
  },
]

describe('SidebarChapters', () => {
  test('renders null when showSidebar is not "chapters"', () => {
    const props = {
      showSidebar: 'metadata',
      spine: buildSpine(),
      currentSpineItemIndex: 0,
      navigateToChapterByURL: jest.fn(),
    }

    const { container } = renderWithStore(<SidebarChapters {...props} />)

    expect(container.innerHTML).toBe('')
  })

  test('renders nested chapter list, highlights current item, and navigates on click', () => {
    const navigateToChapterByURL = jest.fn()
    const spine = buildSpine()

    const props = {
      showSidebar: 'chapters',
      spine,
      currentSpineItemIndex: 0,
      navigateToChapterByURL,
    }

    const { container } = renderWithStore(<SidebarChapters {...props} />)

    // Top-level items: ch1 (with children) and ch2 (inTOC, no title -> fallback label)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(3) // ch1, ch1-1 (nested), ch2 - ch3 excluded (inTOC: false)

    const ch1Button = Array.from(buttons).find(
      (b) => b.textContent === 'Chapter One'
    )
    const ch1SubButton = Array.from(buttons).find(
      (b) => b.textContent === 'Chapter One Sub'
    )
    const ch2Button = Array.from(buttons).find(
      (b) => b.textContent === 'Chapter 0.1'
    )

    expect(ch1Button).toBeDefined()
    expect(ch1SubButton).toBeDefined()
    expect(ch2Button).toBeDefined()

    // current is ch1 (currentSpineItemIndex 0), so ch1 should have the "current" class
    expect(ch1Button.className).toMatch(/bber-chapter--current/)
    expect(ch2Button.className).not.toMatch(/bber-chapter--current/)

    fireEvent.click(ch1SubButton)
    expect(navigateToChapterByURL).toHaveBeenCalledWith('/ch1-1')
  })

  test('defaults currentSpineItemIndex to 0 when not provided', () => {
    const spine = buildSpine()

    const props = {
      showSidebar: 'chapters',
      spine,
      navigateToChapterByURL: jest.fn(),
    }

    const { container } = renderWithStore(<SidebarChapters {...props} />)

    const ch1Button = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Chapter One'
    )

    expect(ch1Button.className).toMatch(/bber-chapter--current/)
  })

  test('renders via readerSettings.SidebarChapters override when present', () => {
    const SidebarChaptersOverride = jest.fn((props) => (
      <div data-testid="custom-chapters">{props.showSidebar}</div>
    ))

    const props = {
      showSidebar: 'chapters',
      spine: buildSpine(),
      currentSpineItemIndex: 0,
      navigateToChapterByURL: jest.fn(),
    }

    const { getByTestId } = renderWithStore(<SidebarChapters {...props} />, {
      overrides: {
        readerSettings: { SidebarChapters: SidebarChaptersOverride },
      },
    })

    expect(getByTestId('custom-chapters').textContent).toBe('chapters')
    expect(SidebarChaptersOverride).toHaveBeenCalled()
  })
})
