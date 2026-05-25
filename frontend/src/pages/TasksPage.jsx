import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import { formatDateTime, getTaskStatus } from '../utils/helpers'
import './TasksPage.css'

function TasksPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { tasks, meta, isLoading, error, loadTasks, removeTask, toggleTask } = useTasks()
  const { categories, loadCategories } = useCategories()
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const searchBarRef = useRef(null)
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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
    // Store task data in sessionStorage for the create-task page to pick up
    sessionStorage.setItem('editingTask', JSON.stringify(task))
    navigate('/create-task')
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
    </section>
  )
}

export default TasksPage

