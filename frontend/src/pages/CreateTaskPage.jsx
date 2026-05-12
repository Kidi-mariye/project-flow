import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { createTask, updateTask } from '../api'
import { normalizeDateTimeForInput, deriveReminderAt, getApiErrorMessage } from '../utils/helpers'

const PRIORITY_OPTIONS = ['high', 'medium', 'low']
const STATUS_OPTIONS = ['completed', 'inprogress', 'todo']
const REMINDER_OPTIONS = [
  { label: 'No reminder', value: 0 },
  { label: '1 day before', value: 1 },
  { label: '2 days before', value: 2 },
  { label: '7 days before', value: 7 },
]

function CreateTaskPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { categories, isLoading: categoriesLoading, loadCategories } = useCategories()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    reminder_days: 0,
  })

  useEffect(() => {
    if (!isAuthenticated) return

    loadCategories()

    // Check if we're editing
    const editingTask = sessionStorage.getItem('editingTask')
    if (editingTask) {
      const task = JSON.parse(editingTask)
      const reminderDays = task.due_date && task.reminder_at
        ? Math.max(0, Math.round((new Date(task.due_date) - new Date(task.reminder_at)) / (1000 * 60 * 60 * 24)))
        : 0

      setEditingTaskId(task.id)
      setForm({
        title: task.title,
        description: task.description || '',
        category_id: task.category_id ? String(task.category_id) : '',
        priority: task.priority || 'medium',
        status: task.completed ? 'completed' : (task.due_date ? 'inprogress' : 'todo'),
        due_date: normalizeDateTimeForInput(task.due_date),
        reminder_days: reminderDays,
      })
      sessionStorage.removeItem('editingTask')
    }
  }, [isAuthenticated])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      let normalizedDueDate = form.due_date ? new Date(form.due_date).toISOString() : null

      if (form.status === 'todo') {
        normalizedDueDate = null
      }

      if (form.status === 'inprogress' && !normalizedDueDate) {
        normalizedDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      const payload = {
        title: form.title,
        description: form.description,
        category_id: form.category_id || null,
        priority: form.priority,
        due_date: normalizedDueDate,
        reminder_at: deriveReminderAt(normalizedDueDate, form.reminder_days),
        completed: form.status === 'completed',
      }

      if (editingTaskId) {
        await updateTask(editingTaskId, payload)
        setMessage('Project updated.')
      } else {
        await createTask(payload)
        setMessage('Project created.')
      }

      // Reset form
      setForm({
        title: '',
        description: '',
        category_id: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        reminder_days: 0,
      })
      setEditingTaskId(null)

      // Redirect to tasks page
      setTimeout(() => navigate('/tasks'), 1000)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save project.'))
    }
  }

  return (
    <section className="page-section">
      <h2>{editingTaskId ? 'Edit Project' : 'Add Project'}</h2>

      {message && <p className="notice ok">{message}</p>}
      {error && <p className="notice error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Project Name
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
          />
        </label>

        <label>
          Category
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          Due Date
          <input
            type="datetime-local"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
          />
        </label>

        <label>
          Reminder
          <select
            name="reminder_days"
            value={form.reminder_days}
            onChange={handleChange}
          >
            {REMINDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="full-row-flex">
          <button type="submit" className="btn primary">
            {editingTaskId ? 'Update Project' : 'Create Project'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/tasks')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateTaskPage