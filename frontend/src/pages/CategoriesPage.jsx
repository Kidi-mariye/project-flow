import { useEffect, useMemo, useState } from 'react'
import { createCategory, deleteCategory, fetchCategories, seedDefaultCategories, updateCategory } from '../api'
import { getApiErrorMessage } from '../utils/helpers'
import '../App.css'
import './CategoriesPage.css'

const EMPTY_FORM = {
  name: '',
  color: '#14b8a6',
}

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load categories.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [categories])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingCategoryId(null)
  }

  const handleEdit = (category) => {
    setEditingCategoryId(category.id)
    setForm({
      name: category.name || '',
      color: category.color || '#14b8a6',
    })
    setStatus('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setStatus('')

    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
      }

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload)
        setStatus('Category updated.')
      } else {
        await createCategory(payload)
        setStatus('Category created.')
      }

      resetForm()
      await loadCategories()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save category.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return
    }

    setError('')
    setStatus('')

    try {
      await deleteCategory(category.id)
      if (editingCategoryId === category.id) {
        resetForm()
      }
      setStatus('Category deleted.')
      await loadCategories()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete category.'))
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    setError('')
    setStatus('')

    try {
      await seedDefaultCategories()
      setStatus('Default categories added.')
      await loadCategories()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add default categories.'))
    } finally {
      setSeeding(false)
    }
  }

  return (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <h2>Categories</h2>
          <p className="page-subtitle">
            Create reusable categories for projects, then filter them across the app.
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={handleSeedDefaults} disabled={seeding}>
          {seeding ? 'Adding...' : 'Add Defaults'}
        </button>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
      {status ? <p className="notice ok">{status}</p> : null}

      <div className="categories-layout">
        <section className="panel categories-form-panel">
          <div className="categories-panel-heading">
            <div>
              <p className="categories-kicker">Category form</p>
              <h3>{editingCategoryId ? 'Edit Category' : 'New Category'}</h3>
            </div>
          </div>

          <form className="categories-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input type="text" name="name" value={form.name} onChange={handleChange} required maxLength={60} />
            </label>

            <label>
              Color
              <input type="color" name="color" value={form.color} onChange={handleChange} />
            </label>

            <div className="actions-row">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Create Category')}
              </button>
              <button type="button" className="btn ghost" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="categories-panel-heading categories-panel-heading--list">
            <h3>All Categories</h3>
            <span className="categories-count">{sortedCategories.length} total</span>
          </div>

          {loading ? (
            <p className="loading-placeholder">Loading...</p>
          ) : sortedCategories.length === 0 ? (
            <p className="categories-empty">No categories yet. Add one or seed the defaults.</p>
          ) : (
            <div className="manage-grid">
              {sortedCategories.map((category) => (
                <article
                  key={category.id}
                  className="manage-card categories-card"
                  style={{ borderLeft: `6px solid ${category.color || '#14b8a6'}` }}
                >
                  <div className="manage-card-header">
                    <h3 className="manage-card-title">{category.name}</h3>
                    <span className="categories-count">{category.tasks_count ?? 0} tasks</span>
                  </div>

                  <div className="categories-card-color">
                    <span className="category-dot" style={{ background: category.color || '#14b8a6' }} />
                    <span>{category.color || '#14b8a6'}</span>
                  </div>

                  <div className="manage-card-actions">
                    <button type="button" className="btn ghost manage-action-btn" data-icon="E" onClick={() => handleEdit(category)}>
                      Edit
                    </button>
                    <button type="button" className="btn danger manage-action-btn" data-icon="D" onClick={() => handleDelete(category)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default CategoriesPage