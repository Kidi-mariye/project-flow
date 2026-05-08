import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage, fileToDataUrl } from '../utils/helpers'
import '../App.css'

function RegisterPage() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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

      <section className="panel" style={{ maxWidth: '400px', margin: '40px auto' }}>
        <div className="tab-row">
          <Link to="/login" className="tab" style={{ textDecoration: 'none', cursor: 'pointer' }}>
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

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb' }}>Login</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
