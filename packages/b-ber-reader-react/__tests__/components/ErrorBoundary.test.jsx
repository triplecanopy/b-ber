import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import ErrorBoundary from '../../src/components/ErrorBoundary'

// A child that throws on demand, controlled by a prop so a single instance
// can be made to recover on retry (simulating a transient failure).
function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('boom')
  return <div data-testid="ok">ok</div>
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy

  beforeEach(() => {
    // React logs the caught error to console.error in addition to
    // componentDidCatch; both are expected here, so the spy just silences
    // the test output rather than asserting call counts.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('ok')).toBeTruthy()
  })

  test('renders a fallback message and retry button when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(
      screen.getByText('Something went wrong while displaying this book.')
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  test('retry re-renders children, recovering once the error condition clears', () => {
    // The control lives outside the boundary: once Bomb throws, the boundary
    // unmounts its entire subtree in favor of the fallback, so anything that
    // could "fix" the cause must be reachable independently of that subtree
    // (e.g. a separate component re-fetching, a parent passing new props).
    let setShouldThrow

    function Wrapper() {
      const [shouldThrow, setter] = React.useState(true)
      setShouldThrow = setter

      return (
        <ErrorBoundary>
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
    }

    const { rerender } = render(<Wrapper />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

    // Resolve the underlying cause, then retry.
    setShouldThrow(false)
    rerender(<Wrapper />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByTestId('ok')).toBeTruthy()
  })
})
