import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import { formatDateTime, getTaskStatus, normalizeDateTimeForInput, deriveReminderAt } from '../utils/helpers'
import './TasksPage.css'

function TasksPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { tasks, meta, isLoading, error, loadTasks, removeTask, toggleTask, editTask } = useTasks()
  const { categories, loadCategories } = useCategories()
  const [message, setMessage] = useState('')
  const [editError, setEditError] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const searchBarRef = useRef(null)
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    due_date: '',
    reminder_days: 0,
    completed: false,
  })

  useEffect(() => {
    if (isAuthenticated) loadCategories()
  }, [isAuthenticated, loadCategories])

  useEffect(() => {
    if (!isAuthenticated) return

    const filters = {
      page: currentPage,
    }
    if (search.trim()) filters.search = search.trim()
    if (categoryId) filters.category_id = categoryId
    if (priority) filters.priority = priority
    if (status === 'completed') filters.completed = true
    else if (status === 'pending') filters.completed = false
    else if (status === 'overdue') filters.overdue = true

    const timeoutId = window.setTimeout(() => {
      loadTasks(filters)
    }, search ? 300 : 0)

    return () => window.clearTimeout(timeoutId)
  }, [isAuthenticated, loadTasks, search, categoryId, priority, status, currentPage])

  const totalPages = meta?.last_page ?? 1
  const fromItem = meta?.from ?? (tasks.length > 0 ? 1 : 0)
  const toItem = meta?.to ?? tasks.length
  const totalItems = meta?.total ?? tasks.length

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const buildFilters = () => {
    const filters = { page: currentPage }
    if (search.trim()) filters.search = search.trim()
    if (categoryId) filters.category_id = categoryId
    if (priority) filters.priority = priority
    if (status === 'completed') filters.completed = true
    else if (status === 'pending') filters.completed = false
    else if (status === 'overdue') filters.overdue = true
    return filters
  }

  const handleToggleTask = async (task) => {
    setMessage('')
    try {
      await toggleTask(task)
      await loadTasks(buildFilters())
      setMessage('Project updated.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (task) => {
    setMessage('')
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await removeTask(task.id)
      await loadTasks(buildFilters())
      setMessage('Project deleted.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditTask = (task) => {
    const reminderDays = task.due_date && task.reminder_at
      ? Math.max(0, Math.round((new Date(task.due_date) - new Date(task.reminder_at)) / (1000 * 60 * 60 * 24)))
      : 0

    setEditError('')
    setEditingTask(task)
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      category_id: task.category_id ? String(task.category_id) : '',
      priority: task.priority || 'medium',
      due_date: normalizeDateTimeForInput(task.due_date),
      reminder_days: reminderDays,
      completed: Boolean(task.completed),
    })
  }

  const closeEditModal = () => {
    setEditingTask(null)
    setEditError('')
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingTask) return

    setMessage('')
    setEditError('')

    try {
      const normalizedDueDate = editForm.due_date ? new Date(editForm.due_date).toISOString() : null
      const payload = {
        title: editForm.title,
        description: editForm.description,
        category_id: editForm.category_id || null,
        priority: editForm.priority,
        due_date: normalizedDueDate,
        reminder_at: deriveReminderAt(normalizedDueDate, editForm.reminder_days),
        completed: editForm.completed,
      }

      await editTask(editingTask.id, payload)
      await loadTasks(buildFilters())
      setMessage('Project updated.')
      closeEditModal()
    } catch (err) {
      setEditError(err?.message || 'Could not update project.')
      console.error(err)
    }
  }

  return (
    <section className="page-section">
      <h2>Manage Projects</h2>

      <div
        className="task-search-bar"
        ref={searchBarRef}
        onFocus={() => setShowFilters(true)}
        onBlur={() => {
          // Delay to allow focus to move to elements inside the dropdown
          setTimeout(() => {
            if (!searchBarRef.current) return
            if (!searchBarRef.current.contains(document.activeElement)) {
              setShowFilters(false)
            }
          }, 0)
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Search projects..."
          aria-label="Search projects"
        />
        {showFilters && (
          <div className="task-filters">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearch('')
                setCategoryId('')
                setPriority('')
                setStatus('')
                setCurrentPage(1)
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {message && <p className="notice ok">{message}</p>}
      {error && <p className="notice error">{error}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No projects yet. <button onClick={() => navigate('/create-task')} className="link-button">Create one</button></p>
      ) : (
        <div className="manage-grid">
          {tasks.map((task) => (
            <article key={task.id} className="manage-card">
              <div className="manage-card-header">
                <h3 className="manage-card-title">{task.title}</h3>
                <div className="manage-card-badges">
                  <span className={`status-badge ${getTaskStatus(task)}`}>{getTaskStatus(task)}</span>
                  <span className={`priority-badge ${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
                </div>
              </div>

              <p className="manage-card-description">{task.description || 'No description provided.'}</p>

              <div className="manage-card-meta">
                <div>
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{formatDateTime(task.created_at)}</span>
                </div>
                <div>
                  <span className="meta-label">Due</span>
                  <span className="meta-value">{formatDateTime(task.due_date)}</span>
                </div>
              </div>

              <div className="actions-row manage-card-actions">
                <button
                  type="button"
                  className="btn ghost manage-action-btn"
                  data-icon="E"
                  onClick={() => handleEditTask(task)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn ghost manage-action-btn"
                  data-icon="S"
                  onClick={() => handleToggleTask(task)}
                >
                  {task.completed ? 'Undo' : 'Done'}
                </button>
                <button
                  type="button"
                  className="btn danger manage-action-btn"
                  data-icon="D"
                  onClick={() => handleDeleteTask(task)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalItems > 0 && totalPages > 1 && (
        <div className="pagination-bar" style={{ marginTop: '24px' }}>
          <div className="pagination-summary">
            Showing {fromItem}-{toItem} of {totalItems} projects
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn ghost"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <span className="pagination-page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn ghost"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="task-modal-overlay" role="presentation" onClick={closeEditModal}>
          <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-edit-title" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <div>
                <p className="task-modal-kicker">Edit project</p>
                <h3 id="task-edit-title">{editingTask.title}</h3>
              </div>
              <button type="button" className="task-modal-close" onClick={closeEditModal} aria-label="Close edit dialog">
                ×
              </button>
            </div>

            {editError && <p className="notice error">{editError}</p>}

            <form className="task-modal-form" onSubmit={handleEditSubmit}>
              <label>
                Project Name
                <input type="text" name="title" value={editForm.title} onChange={handleEditChange} required />
              </label>

              <label>
                Description
                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={3} />
              </label>

              <label>
                Category
                <select name="category_id" value={editForm.category_id} onChange={handleEditChange}>
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="task-modal-grid">
                <label>
                  Priority
                  <select name="priority" value={editForm.priority} onChange={handleEditChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  Due Date
                  <input type="datetime-local" name="due_date" value={editForm.due_date} onChange={handleEditChange} />
                </label>
              </div>

              <div className="task-modal-grid task-modal-grid--compact">
                <label>
                  Reminder Days
                  <select
                    name="reminder_days"
                    value={editForm.reminder_days}
                    onChange={handleEditChange}
                    disabled={!editForm.due_date}
                  >
                    <option value={0}>No reminder</option>
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={7}>7 days before</option>
                  </select>
                </label>

                <label className="task-modal-checkbox">
                  <span>Completed</span>
                  <input type="checkbox" name="completed" checked={editForm.completed} onChange={handleEditChange} />
                </label>
              </div>

              <div className="task-modal-actions">
                <button type="submit" className="btn primary">Save changes</button>
                <button type="button" className="btn ghost" onClick={closeEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default TasksPage

