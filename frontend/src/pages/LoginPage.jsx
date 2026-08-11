import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchLoginOptions } from '../api'
import { getApiErrorMessage } from '../utils/helpers'
import '../App.css'
import './AuthPages.css'

function LoginPage() {
  const { login, completeLoginChallenge, isLoading } = useAuth()
  const navigate = useNavigate()
  const showDemoCodes = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CODES === 'true'
  const [form, setForm] = useState({ email: '', password: '', provider: 'google', verificationCode: '' })
  const [loginOptions, setLoginOptions] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [challengeState, setChallengeState] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const loginMethod = loginOptions?.account?.loginMethod || 'password'
  const availableProviders = useMemo(() => {
    const connected = loginOptions?.account?.connectedAccounts || {}
    return [
      { key: 'google', label: 'Google' },
      { key: 'microsoft', label: 'Microsoft' },
      { key: 'github', label: 'GitHub' },
    ].filter((provider) => connected[provider.key])
  }, [loginOptions])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (name === 'email') {
      setLoginOptions(null)
      setChallengeState(null)
      setStatus('')
    }
  }

  const loadLoginOptions = async () => {
    if (!form.email.trim()) {
      setError('Enter your email first.')
      return null
    }

    setLookupLoading(true)
    setError('')
    try {
      const options = await fetchLoginOptions(form.email.trim())
      setLoginOptions(options)
      setStatus(options?.exists ? `Account uses ${options.account?.loginMethod || 'password'} login.` : 'Account not found. You can still register.')
      return options
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load login options.'))
      return null
    } finally {
      setLookupLoading(false)
    }
  }

  const startMagicOrOauthLogin = async (method, provider) => {
    const selectedProvider = provider || form.provider || availableProviders[0]?.key || 'google'

    const payload = {
      email: form.email.trim(),
      method,
    }

    if (method === 'oauth') {
      payload.provider = selectedProvider
    }

    const response = await login(payload)
    if (response?.requires_verification) {
      setChallengeState({
        challengeId: response.challenge_id,
        verificationType: response.verification_type,
        verificationCode: response.verification_code || '',
        provider: response.provider || selectedProvider,
      })
      setStatus(response.message || 'Verification code generated.')
      return true
    }

    navigate('/dashboard')
    return true
  }

  const handleContinue = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')
    setChallengeState(null)

    const options = await loadLoginOptions()
    if (!options) {
      return
    }

    const method = options.account?.loginMethod || 'password'

    if (method === 'password') {
      setStatus('Password login ready.')
      return
    }

    const provider = options.account?.connectedAccounts?.google
      ? 'google'
      : (options.account?.connectedAccounts?.microsoft
        ? 'microsoft'
        : (options.account?.connectedAccounts?.github ? 'github' : availableProviders[0]?.key || 'google'))

    setForm((current) => ({
      ...current,
      provider,
    }))

    await startMagicOrOauthLogin(method, provider)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')

    if (challengeState?.challengeId) {
      try {
        await completeLoginChallenge(challengeState.challengeId, form.verificationCode.trim())
        navigate('/dashboard')
      } catch (err) {
        setError(getApiErrorMessage(err, 'Verification failed'))
      }
      return
    }

    const options = loginOptions || await loadLoginOptions()
    if (!options) {
      return
    }

    const method = options.account?.loginMethod || 'password'
    const provider = options.account?.connectedAccounts?.[form.provider]
      ? form.provider
      : (availableProviders[0]?.key || 'google')

    try {
      const response = await login({
        email: form.email.trim(),
        password: method === 'password' ? form.password : undefined,
        method,
        provider,
      })

      if (response?.requires_verification) {
        setChallengeState({
          challengeId: response.challenge_id,
          verificationType: response.verification_type,
          verificationCode: response.verification_code || '',
          provider: response.provider || provider,
        })
        setStatus(response.message || 'Verification code generated.')
        return
      }

      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'))
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
          <p className="auth-eyebrow">Welcome back</p>
          <h2>Jump back into your work without losing momentum.</h2>
          <p>
            Manage projects, check deadlines, and keep everything moving from one focused dashboard.
          </p>
          <ul className="auth-hero-list">
            <li>Priority-driven project tracking</li>
            <li>Clear task progress at a glance</li>
            <li>Fast access to reminders and updates</li>
          </ul>
        </aside>

        <section className="panel auth-panel auth-card">
          <div className="tab-row auth-tab-row">
            <button type="button" className="tab active">
              Login
            </button>
            <Link to="/register" className="tab link-no-underline">
              Register
            </Link>
          </div>

          <p className="auth-card-title">Sign in to your workspace</p>

          {error && <p className="notice error">{error}</p>}
          {status && <p className="notice">{status}</p>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </label>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="btn ghost" onClick={handleContinue} disabled={lookupLoading || isLoading}>
                {lookupLoading ? 'Checking...' : 'Continue'}
              </button>
            </div>

            {loginMethod === 'password' && (
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  minLength={8}
                  required
                />
              </label>
            )}

            {loginMethod === 'password' && !challengeState && (
              <p className="auth-footer" style={{ marginTop: '0' }}>
                <Link to="/forgot-password" className="link-primary">Forgot password?</Link>
              </p>
            )}

            {loginMethod === 'oauth' && availableProviders.length > 0 && !challengeState && (
              <label>
                Provider
                <select name="provider" value={form.provider} onChange={handleChange} className="form-input">
                  {availableProviders.map((provider) => (
                    <option key={provider.key} value={provider.key}>{provider.label}</option>
                  ))}
                </select>
              </label>
            )}

            {challengeState && (
              <label>
                Verification Code
                <input
                  type="text"
                  name="verificationCode"
                  value={form.verificationCode}
                  onChange={handleChange}
                  placeholder="Enter the 6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            )}

            {challengeState?.verificationCode && showDemoCodes ? (
              <div className="notice" style={{ marginTop: '0' }}>
                Demo code for this local app: <strong>{challengeState.verificationCode}</strong>
              </div>
            ) : null}

            <button
              type="submit"
              className="btn primary auth-submit"
              disabled={lookupLoading || isLoading}
            >
              {challengeState ? 'Verify Code' : (loginMethod === 'password' ? 'Login' : 'Send Code')}
            </button>

            {loginMethod === 'oauth' && availableProviders.length > 0 && !challengeState && (
              <p className="auth-footer" style={{ marginTop: '0' }}>
                Connected providers: {availableProviders.map((provider) => provider.label).join(', ')}
              </p>
            )}
          </form>

          <p className="auth-footer">
            <Link to="/privacy" className="link-primary">Privacy</Link>
            {' · '}
            <Link to="/terms" className="link-primary">Terms</Link>
          </p>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
