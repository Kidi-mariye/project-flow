import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage } from '../utils/helpers'
import '../App.css'

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
    <main className="app-shell">
      <header className="topbar">
        <h1 className="project-flow-title">Task Manager</h1>
      </header>

      <section className="panel" style={{ maxWidth: '400px', margin: '40px auto' }}>
        <div className="tab-row">
          <button type="button" className="tab active">
            Login
          </button>
          <Link to="/register" className="tab" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            Register
          </Link>
        </div>

        {error && <p className="notice error">{error}</p>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
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
              minLength={8}
              required
            />
          </label>

          <button 
            type="submit" 
            className="btn primary"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2563eb' }}>Register</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
