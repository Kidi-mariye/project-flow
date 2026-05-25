import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage, fileToDataUrl } from '../utils/helpers'
import '../App.css'

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
    <main className="app-shell">
      <header className="topbar">
        <h1 className="project-flow-title">Task Manager</h1>
      </header>

      <section className="panel auth-panel">
        <div className="tab-row">
          <Link to="/login" className="tab link-no-underline">
            Login
          </Link>
          <button type="button" className="tab active">
            Register
          </button>
        </div>

        {error && <p className="notice error">{error}</p>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
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
              required
            />
          </label>

          <label>
            Password (min 8 characters)
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
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
              minLength={8}
              required
            />
          </label>

          <label>
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
            className="btn primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="center-mt20">
          Already have an account? <Link to="/login" className="link-primary">Login</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
