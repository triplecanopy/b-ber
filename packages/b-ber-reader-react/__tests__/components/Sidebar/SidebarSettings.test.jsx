/* eslint-disable react/jsx-props-no-spreading */

import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import SidebarSettings from '../../../src/components/Sidebar/SidebarSettings'

const buildProps = (overrides = {}) => ({
  showSidebar: 'settings',
  viewerSettings: { fontSize: 100 },
  update: jest.fn(),
  save: jest.fn(),
  ...overrides,
})

describe('SidebarSettings', () => {
  test('renders open class when showSidebar is "settings"', () => {
    const props = buildProps()
    const { container, getByText } = render(<SidebarSettings {...props} />)

    expect(
      container.querySelector('.bber-controls__sidebar__settings--open')
    ).not.toBeNull()
    expect(getByText('100%')).not.toBeNull()
  })

  test('does not render open class when showSidebar is not "settings"', () => {
    const props = buildProps({ showSidebar: 'chapters' })
    const { container } = render(<SidebarSettings {...props} />)

    expect(
      container.querySelector('.bber-controls__sidebar__settings--open')
    ).toBeNull()
    // nav element still renders
    expect(container.querySelector('nav.bber-controls__sidebar')).not.toBeNull()
  })

  test('increments font size and calls update/save', () => {
    const props = buildProps()
    const { getByText } = render(<SidebarSettings {...props} />)

    const incrementButton = getByText('+')
    fireEvent.click(incrementButton)

    expect(getByText('110%')).not.toBeNull()
    expect(props.update).toHaveBeenCalledWith({ fontSize: 110 })
    expect(props.save).toHaveBeenCalled()
  })

  test('decrements font size and calls update/save', () => {
    const props = buildProps()
    const { getByText } = render(<SidebarSettings {...props} />)

    const decrementButton = getByText('-')
    fireEvent.click(decrementButton)

    expect(getByText('90%')).not.toBeNull()
    expect(props.update).toHaveBeenCalledWith({ fontSize: 90 })
    expect(props.save).toHaveBeenCalled()
  })

  test('does not increment past fontSizeMax', () => {
    const props = buildProps({ viewerSettings: { fontSize: 250 } })
    const { getByText } = render(<SidebarSettings {...props} />)

    const incrementButton = getByText('+')
    fireEvent.click(incrementButton)

    expect(getByText('250%')).not.toBeNull()
    expect(props.update).not.toHaveBeenCalled()
    expect(props.save).not.toHaveBeenCalled()
  })

  test('does not decrement past fontSizeMin', () => {
    const props = buildProps({ viewerSettings: { fontSize: 50 } })
    const { getByText } = render(<SidebarSettings {...props} />)

    const decrementButton = getByText('-')
    fireEvent.click(decrementButton)

    expect(getByText('50%')).not.toBeNull()
    expect(props.update).not.toHaveBeenCalled()
    expect(props.save).not.toHaveBeenCalled()
  })

  test('handleOnChange updates internal state without calling update/save', () => {
    const props = buildProps()
    const { container } = render(<SidebarSettings {...props} />)

    const input = container.querySelector('input#fontSize')
    fireEvent.change(input, { target: { value: '120' } })

    expect(input.value).toBe('120')
    expect(props.update).not.toHaveBeenCalled()
    expect(props.save).not.toHaveBeenCalled()
  })

  test('handleOnBlur rounds, clamps, and commits a valid font size', () => {
    const props = buildProps()
    const { container, getByText } = render(<SidebarSettings {...props} />)

    const input = container.querySelector('input#fontSize')
    fireEvent.change(input, { target: { value: '124' } })
    fireEvent.blur(input)

    // Math.round(124 * 0.1) * 10 = 120
    expect(getByText('120%')).not.toBeNull()
    expect(props.update).toHaveBeenCalledWith({ fontSize: 120 })
    expect(props.save).toHaveBeenCalled()
  })

  test('handleOnBlur does not commit when result is out of range', () => {
    const props = buildProps()
    const { container, getByText } = render(<SidebarSettings {...props} />)

    const input = container.querySelector('input#fontSize')
    // 251 * 0.1 = 25.1, rounds to 25, * 10 = 250 -> within range, so use a value
    // that rounds out of range instead: 256 -> round(25.6) = 26 -> *10 = 260 > 250
    fireEvent.change(input, { target: { value: '256' } })
    fireEvent.blur(input)

    expect(getByText('256%')).not.toBeNull()
    expect(props.update).not.toHaveBeenCalled()
    expect(props.save).not.toHaveBeenCalled()
  })

  test('UNSAFE_componentWillReceiveProps syncs fontSize when viewerSettings.fontSize prop changes', () => {
    const props = buildProps({ viewerSettings: { fontSize: 100 } })
    const { rerender, getByText } = render(<SidebarSettings {...props} />)

    expect(getByText('100%')).not.toBeNull()

    rerender(<SidebarSettings {...props} viewerSettings={{ fontSize: 150 }} />)

    expect(getByText('150%')).not.toBeNull()
  })

  test('UNSAFE_componentWillReceiveProps does not update state when fontSize is unchanged', () => {
    const props = buildProps({ viewerSettings: { fontSize: 100 } })
    const { rerender, getByText } = render(<SidebarSettings {...props} />)

    rerender(<SidebarSettings {...props} viewerSettings={{ fontSize: 100 }} />)

    expect(getByText('100%')).not.toBeNull()
  })
})
