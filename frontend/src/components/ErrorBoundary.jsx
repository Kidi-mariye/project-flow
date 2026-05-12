import React from 'react'

/**
 * Error Boundary Component - Catches errors in child components
 * Displays user-friendly error message with retry option
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            <p style={styles.message}>
              We apologize for the inconvenience. An unexpected error occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.pre}>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre style={styles.pre}>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <button onClick={this.handleReset} style={styles.button}>
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-page)',
    padding: '20px',
  },
  errorBox: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '500px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--slate-700)',
    marginBottom: '16px',
  },
  message: {
    fontSize: '16px',
    color: 'var(--slate-500)',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  details: {
    margin: '24px 0',
    textAlign: 'left',
    backgroundColor: 'var(--bg-soft)',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid var(--slate-100)',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: 'var(--slate-500)',
    marginBottom: '8px',
  },
  pre: {
    overflow: 'auto',
    fontSize: '12px',
    color: 'var(--status-blocked)',
    backgroundColor: 'rgba(220,38,38,0.06)',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '8px',
  },
  button: {
    marginTop: '24px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--bg-surface)',
    backgroundColor: 'var(--primary-600)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
}
