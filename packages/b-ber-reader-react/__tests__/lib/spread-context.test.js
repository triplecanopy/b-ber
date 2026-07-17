import { render, screen } from '@testing-library/react'
import React from 'react'
import SpreadContext from '../../src/lib/spread-context'

test('has the expected display name', () => {
  expect(SpreadContext.displayName).toBe('SpreadContext')
})

test('provides default context value of { left: 0, layout: "columns" }', () => {
  function Consumer() {
    const { left, layout } = React.useContext(SpreadContext)
    return <div data-testid="value">{`${left}-${layout}`}</div>
  }

  render(<Consumer />)

  expect(screen.getByTestId('value').textContent).toBe('0-columns')
})

test('Provider overrides the default context value', () => {
  function Consumer() {
    const { left, layout } = React.useContext(SpreadContext)
    return <div data-testid="value">{`${left}-${layout}`}</div>
  }

  render(
    <SpreadContext.Provider value={{ left: 10, layout: 'scroll' }}>
      <Consumer />
    </SpreadContext.Provider>
  )

  expect(screen.getByTestId('value').textContent).toBe('10-scroll')
})
