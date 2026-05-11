import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { formatDateTime, getTaskStatus } from '../utils/helpers'

function TasksPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { tasks, isLoading, error, loadTasks, editTask, removeTask, toggleTask } = useTasks()
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks({ search: search.trim() || undefined })
    }
  }, [isAuthenticated, loadTasks, search])

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadTasks({ search: search.trim() || undefined })
  }

  const handleToggleTask = async (task) => {
    setMessage('')
    try {
      await toggleTask(task)
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

      <form className="task-search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects by title or description"
          aria-label="Search projects"
        />
        <button type="submit" className="btn ghost">Search</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setSearch('')
            loadTasks()
          }}
        >
          Clear
        </button>
      </form>

      {message && <p className="notice ok">{message}</p>}
      {error && <p className="notice error">{error}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No projects yet. <button onClick={() => navigate('/create-task')} style={{ cursor: 'pointer', color: '#2563eb' }}>Create one</button></p>
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
    </section>
  )
}

export default TasksPage

