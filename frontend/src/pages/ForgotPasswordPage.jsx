import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../api'
import { getApiErrorMessage } from '../utils/helpers'
import '../App.css'
import './AuthPages.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [step, setStep] = useState('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')
    setIsLoading(true)
    try {
      const res = await forgotPassword(email.trim())
      if (res.debug_code) {
        setStatus(`Dev mailer is active — your reset code is ${res.debug_code}. It expires in 30 minutes.`)
      } else {
        setStatus('If that email address is registered, a 6-digit reset code has been sent. It expires in 30 minutes.')
      }
      setStep('reset')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not request a reset code.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')
    setIsLoading(true)
    try {
      await resetPassword({
        email: email.trim(),
        verification_code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      setStep('done')
      setStatus('Your password has been reset. You can now log in with your new password.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset the password.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="app-shell auth-shell-page">
      <header className="topbar auth-topbar">
        <h1 className="project-flow-title">Task Manager</h1>
        <p className="auth-topbar-subtitle">Plan. Track. Deliver.</p>
      </header>

      <section className="auth-layout">
        <aside className="auth-hero auth-hero--login">
          <p className="auth-eyebrow">Account recovery</p>
          <h2>Forgot your password? Reset it in under a minute.</h2>
          <p>
            We will email you a one-time 6-digit code. Enter it with a new password and you are back in.
          </p>
          <ul className="auth-hero-list">
            <li>Secure, code-based verification</li>
            <li>Codes expire after 30 minutes</li>
            <li>All existing sessions are signed out on reset</li>
          </ul>
        </aside>

        <section className="panel auth-panel auth-card">
          <div className="tab-row auth-tab-row">
            <Link to="/login" className="tab link-no-underline">
              Back to Login
            </Link>
          </div>

          <p className="auth-card-title">Reset your password</p>

          {error && <p className="notice error">{error}</p>}
          {status && <p className="notice">{status}</p>}

          {step === 'email' && (
            <form className="auth-form" onSubmit={handleSendCode}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>

              <button type="submit" className="btn primary auth-submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form className="auth-form" onSubmit={handleReset}>
              <label>
                Verification Code
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>

              <div className="auth-grid">
                <label>
                  New Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repeat the new password"
                    minLength={8}
                    required
                  />
                </label>
              </div>

              <button type="submit" className="btn primary auth-submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <p className="auth-footer" style={{ marginTop: '0' }}>
              <Link to="/login" className="link-primary">Back to Login</Link>
            </p>
          )}
        </section>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
