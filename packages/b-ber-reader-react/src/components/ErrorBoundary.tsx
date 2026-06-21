import React from 'react'

interface ErrorBoundaryProps {
  children?: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// React has no hook equivalent of getDerivedStateFromError/componentDidCatch —
// error boundaries MUST be class components (see React docs). This is the one
// permitted exception to the "no new class components" rule (AGENTS.md).
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Matches the console.error convention used elsewhere in this package
    // (App.tsx, Footnote.tsx, etc.) — there is no b-ber-logger dependency here,
    // it's a build-pipeline package, not relevant to this browser-facing one.
    console.error('Reader crashed:', error, info.componentStack)
  }

  handleRetry = (): void => {
    // Clearing the error re-renders children; if the underlying state that
    // caused the crash hasn't changed, it may throw again immediately — that's
    // expected and acceptable, the user can retry as many times as they like.
    this.setState({ error: null })
  }

  render(): React.ReactNode {
    const { error } = this.state

    if (error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <p>Something went wrong while displaying this book.</p>
          <button type="button" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
