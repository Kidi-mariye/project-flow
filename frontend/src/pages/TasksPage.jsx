import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchFilteredTasks, updateTask, deleteTask } from '../api'
import { formatDateTime, getTaskStatus } from '../utils/helpers'

function TasksPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadTasks = async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchFilteredTasks()
      setTasks(data)
    } catch (err) {
      setError('Failed to load tasks')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [isAuthenticated])

  const handleToggleTask = async (task) => {
    setMessage('')
    setError('')
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        category_id: task.category_id,
        priority: task.priority,
        due_date: task.due_date,
        reminder_at: task.reminder_at,
        completed: !task.completed,
      })
      await loadTasks()
      setMessage('Project updated.')
    } catch (err) {
      setError('Could not update project.')
      console.error(err)
    }
  }

  const handleDeleteTask = async (task) => {
    setMessage('')
    setError('')
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await deleteTask(task.id)
      await loadTasks()
      setMessage('Project deleted.')
    } catch (err) {
      setError('Could not delete project.')
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
