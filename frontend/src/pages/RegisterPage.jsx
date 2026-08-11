import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage, fileToDataUrl } from '../utils/helpers'
import '../App.css'
import './AuthPages.css'

function RegisterPage() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview('')
      return
    }
    setImageFile(file)
    const preview = await fileToDataUrl(file)
    setImagePreview(preview)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match')
        return
      }
      const user = await register(form.name, form.email, form.password)
      
      // Save profile image if provided
      if (imageFile && user?.email) {
        const imageDataUrl = await fileToDataUrl(imageFile)
        localStorage.setItem(`profile_image_${user.email}`, imageDataUrl)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'))
    }
  }

  return (
    <main className="app-shell auth-shell-page">
      <header className="topbar auth-topbar">
        <h1 className="project-flow-title">Task Manager</h1>
        <p className="auth-topbar-subtitle">Plan. Track. Deliver.</p>
      </header>

      <section className="auth-layout">
        <aside className="auth-hero auth-hero--register">
          <p className="auth-eyebrow">Get started</p>
          <h2>Create your workspace and keep every project organized.</h2>
          <p>
            Set up your account to manage tasks, attach reminders, and keep team progress in one place.
          </p>
          <ul className="auth-hero-list">
            <li>Personalized project dashboard</li>
            <li>Notifications and reminders built in</li>
            <li>Quick updates with fewer clicks</li>
          </ul>
        </aside>

        <section className="panel auth-panel auth-card auth-card--register">
          <div className="tab-row auth-tab-row">
            <Link to="/login" className="tab link-no-underline">
              Login
            </Link>
            <button type="button" className="tab active">
              Register
            </button>
          </div>

          <p className="auth-card-title">Create your account</p>

          {error && <p className="notice error">{error}</p>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-grid">
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </label>

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
            </div>

            <div className="auth-grid">
              <label>
                Password (min 8 characters)
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Choose a password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  minLength={8}
                  required
                />
              </label>
            </div>

            <label className="auth-file-field">
              Upload Profile Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="register-image-preview"
                />
              )}
            </label>

            <button
              type="submit"
              className="btn primary auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="link-primary">Login</Link>
          </p>

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

export default RegisterPage
