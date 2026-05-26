import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage } from '../utils/helpers'
import '../App.css'
import './AuthPages.css'

function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
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

            <button
              type="submit"
              className="btn primary auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="link-primary">Create one</Link>
          </p>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
