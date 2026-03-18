import { useEffect, useMemo, useState } from 'react'
import {
  clearStoredToken,
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  fetchCategories,
  fetchCurrentUser,
  fetchFilteredTasks,
  getStoredToken,
  loginUser,
  logoutUser,
  registerUser,
  seedDefaultCategories,
  setStoredToken,
  updateCategory,
  updateTask,
} from './api'
import './App.css'

const PRIORITY_OPTIONS = ['high', 'medium', 'low']
const REMINDER_OPTIONS = [
  { label: 'No reminder', value: 0 },
  { label: '1 day before', value: 1 },
  { label: '2 days before', value: 2 },
  { label: '7 days before', value: 7 },
]
const SIDEBAR_LINKS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'manage-tasks', label: 'Manage Tasks' },
  { id: 'create-task', label: 'Create Task' },
  { id: 'settings', label: 'Settings' },
]

function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleString()
}

function normalizeDateTimeForInput(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function deriveReminderAt(dueDate, reminderDays) {
  if (!dueDate || !reminderDays) {
    return null
  }

  const due = new Date(dueDate)
  due.setDate(due.getDate() - Number(reminderDays))
  return due.toISOString()
}

function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (responseData?.errors) {
    const firstFieldErrors = Object.values(responseData.errors)[0]

    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return firstFieldErrors[0]
    }
  }

  if (responseData?.message) {
    return responseData.message
  }

  if (error?.message?.toLowerCase().includes('network')) {
    return 'Cannot reach API server. Start Laravel with: php artisan serve'
  }

  return fallbackMessage
}

function getTaskStatus(task) {
  if (task.completed) {
    return 'completed'
  }

  if (task.due_date) {
    return 'inprogress'
  }

  return 'pending'
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    due_date: '',
    reminder_days: 0,
  })
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#0b5fff', id: null })
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ category_id: '', priority: '', completed: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()))
  const [currentUser, setCurrentUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activePage, setActivePage] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      void loadPlannerData()
    }
  }, [isAuthenticated])

  async function loadPlannerData(activeFilters = filters) {
    setIsLoading(true)
    setError('')

    try {
      const [taskData, categoryData, userData] = await Promise.all([
        fetchFilteredTasks(activeFilters),
        fetchCategories(),
        fetchCurrentUser(),
      ])

      let finalCategories = categoryData

      if (categoryData.length === 0) {
        finalCategories = await seedDefaultCategories()
      }

      setTasks(taskData)
      setCategories(finalCategories)
      setCurrentUser(userData)
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not load tasks. Please log in again.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        email: authForm.email,
        password: authForm.password,
      }

      const response = authMode === 'register'
        ? await registerUser({ ...payload, name: authForm.name })
        : await loginUser(payload)

      setStoredToken(response.token)
      setCurrentUser(response.user ?? null)
      setIsAuthenticated(true)
      setActivePage('dashboard')
      setAuthForm({ name: '', email: '', password: '' })
      setMessage(authMode === 'register' ? 'Account created.' : 'Logged in successfully.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Authentication failed.'))
    }
  }

  async function handleLogout() {
    setMessage('')
    setError('')

    try {
      await logoutUser()
    } catch {
      // Keep local cleanup even if token is invalid.
    }

    clearStoredToken()
    setIsAuthenticated(false)
    setTasks([])
    setCategories([])
    setCurrentUser(null)
    setActivePage('dashboard')
    setMessage('Logged out.')
  }

  async function handleApplyFilters(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    await loadPlannerData(filters)
  }

  function resetTaskForm() {
    setTaskForm({
      title: '',
      description: '',
      category_id: '',
      priority: 'medium',
      due_date: '',
      reminder_days: 0,
    })
    setEditingTaskId(null)
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        category_id: taskForm.category_id || null,
        priority: taskForm.priority,
        due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
        reminder_at: deriveReminderAt(taskForm.due_date, taskForm.reminder_days),
      }

      if (editingTaskId) {
        await updateTask(editingTaskId, payload)
        setMessage('Task updated.')
      } else {
        await createTask(payload)
        setMessage('Task created.')
      }

      resetTaskForm()
      await loadPlannerData()
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not save task.'))
    }
  }

  function startEditTask(task) {
    const reminderDays = task.due_date && task.reminder_at
      ? Math.max(0, Math.round((new Date(task.due_date) - new Date(task.reminder_at)) / (1000 * 60 * 60 * 24)))
      : 0

    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category_id: task.category_id ? String(task.category_id) : '',
      priority: task.priority || 'medium',
      due_date: normalizeDateTimeForInput(task.due_date),
      reminder_days: reminderDays,
    })
  }

  async function handleToggleTask(task) {
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

      await loadPlannerData()
      setMessage('Task updated.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not update task.'))
    }
  }

  async function handleDeleteTask(task) {
    setMessage('')
    setError('')

    try {
      await deleteTask(task.id)
      await loadPlannerData()
      setMessage('Task deleted.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not delete task.'))
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, {
          name: categoryForm.name,
          color: categoryForm.color,
        })
        setMessage('Category updated.')
      } else {
        await createCategory({
          name: categoryForm.name,
          color: categoryForm.color,
        })
        setMessage('Category created.')
      }

      setCategoryForm({ name: '', color: '#0b5fff', id: null })
      await loadPlannerData()
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not save category.'))
    }
  }

  function startEditCategory(category) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      color: category.color || '#0b5fff',
    })
  }

  async function handleDeleteCategory(categoryId) {
    setMessage('')
    setError('')

    try {
      await deleteCategory(categoryId)
      await loadPlannerData()
      setMessage('Category deleted.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not delete category.'))
    }
  }

  async function handleSeedDefaultCategories() {
    setMessage('')
    setError('')

    try {
      const seeded = await seedDefaultCategories()
      setCategories(seeded)
      await loadPlannerData()
      setMessage('Default project categories added.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not add default project categories.'))
    }
  }

  const allTasks = useMemo(
    () => [...tasks].sort((left, right) => new Date(right.created_at) - new Date(left.created_at)),
    [tasks],
  )

  const completedTasks = useMemo(() => allTasks.filter((task) => task.completed), [allTasks])
  const inProgressTasks = useMemo(() => allTasks.filter((task) => !task.completed && task.due_date), [allTasks])
  const todoTasks = useMemo(() => allTasks.filter((task) => !task.completed && !task.due_date), [allTasks])

  const priorityChartRows = useMemo(() => {
    const rows = [
      {
        label: 'High',
        value: allTasks.filter((task) => (task.priority || 'medium') === 'high').length,
        color: '#dc2626',
      },
      {
        label: 'Medium',
        value: allTasks.filter((task) => (task.priority || 'medium') === 'medium').length,
        color: '#d97706',
      },
      {
        label: 'Low',
        value: allTasks.filter((task) => (task.priority || 'medium') === 'low').length,
        color: '#16a34a',
      },
    ]

    const maxValue = Math.max(...rows.map((row) => row.value), 1)

    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.value / maxValue) * 100),
    }))
  }, [allTasks])

  const taskDistribution = useMemo(() => {
    const total = Math.max(allTasks.length, 1)
    const completedPercent = Math.round((completedTasks.length / total) * 100)
    const inProgressPercent = Math.round((inProgressTasks.length / total) * 100)
    const todoPercent = Math.max(0, 100 - completedPercent - inProgressPercent)

    return {
      completedPercent,
      inProgressPercent,
      todoPercent,
    }
  }, [allTasks.length, completedTasks.length, inProgressTasks.length])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Task Manager</p>
          <h1>React + Laravel API</h1>
        </div>
      </header>

      {message ? <p className="notice ok">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      {!isAuthenticated ? (
        <section className="panel">
          <div className="tab-row">
            <button
              type="button"
              className={`tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form-grid" onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <label>
                Name
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                minLength={8}
                required
              />
            </label>

            <button type="submit" className="btn primary">
              {authMode === 'register' ? 'Create Account' : 'Login'}
            </button>
          </form>
        </section>
      ) : (
        <div className="dashboard-layout">
          <aside className="sidebar panel">
            <h2>Navigation</h2>
            <nav>
              <ul className="sidebar-nav">
                {SIDEBAR_LINKS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={activePage === item.id ? 'active' : ''}
                      onClick={() => setActivePage(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="sidebar-actions">
              <button type="button" className="btn danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </aside>

          <div className="dashboard-content">
            {activePage === 'dashboard' ? (
              <section className="panel">
              <h2>Dashboard</h2>
              <p className="dashboard-greeting">Good Morning, {currentUser?.name || 'User'}</p>

              <div className="metrics-grid">
                <div className="metric-card">
                  <p>Total Tasks</p>
                  <h3>{allTasks.length}</h3>
                </div>
                <div className="metric-card">
                  <p>Completed</p>
                  <h3>{completedTasks.length}</h3>
                </div>
                <div className="metric-card">
                  <p>Inprogress</p>
                  <h3>{inProgressTasks.length}</h3>
                </div>
                <div className="metric-card">
                  <p>Todo</p>
                  <h3>{todoTasks.length}</h3>
                </div>
              </div>

              <div className="dashboard-charts two-col">
                <div className="dashboard-chart panel-soft">
                  <h3>Task Distribution</h3>
                  <div className="distribution-wrap">
                    <div
                      className="distribution-circle"
                      style={{
                        background: `conic-gradient(#16a34a 0 ${taskDistribution.completedPercent}%, #d97706 ${taskDistribution.completedPercent}% ${taskDistribution.completedPercent + taskDistribution.inProgressPercent}%, #7c3aed ${taskDistribution.completedPercent + taskDistribution.inProgressPercent}% 100%)`,
                      }}
                    >
                      <span>{allTasks.length}</span>
                    </div>
                    <ul className="distribution-legend">
                      <li><span className="legend-dot completed" />Completed ({completedTasks.length})</li>
                      <li><span className="legend-dot inprogress" />Inprogress ({inProgressTasks.length})</li>
                      <li><span className="legend-dot todo" />Todo ({todoTasks.length})</li>
                    </ul>
                  </div>
                </div>

                <div className="dashboard-chart panel-soft">
                  <h3>Priority Bar Graph</h3>
                  <ul className="chart-list">
                    {priorityChartRows.map((row) => (
                      <li key={row.label}>
                        <span className="chart-label">{row.label}</span>
                        <div className="chart-bar-track">
                          <div className="chart-bar-fill" style={{ width: `${row.percent}%`, background: row.color }} />
                        </div>
                        <span className="chart-value">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="dashboard-table panel-soft">
                <h3>Tasks Table</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Priority</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTasks.slice(0, 10).map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td><span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span></td>
                        <td>{formatDateTime(task.created_at)}</td>
                      </tr>
                    ))}
                    {allTasks.length === 0 ? (
                      <tr>
                        <td colSpan={3}>No tasks yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              </section>
            ) : null}

            {activePage === 'manage-tasks' ? (
              <section className="panel">
                <h2>Manage Tasks</h2>

                {isLoading ? <p>Loading...</p> : null}
                {!isLoading && allTasks.length === 0 ? <p>No tasks yet.</p> : null}

                <div className="manage-grid">
                  {allTasks.map((task) => (
                    <article key={task.id} className="manage-card">
                      <h3>{task.title}</h3>
                      <p>
                        <strong>Priority:</strong>{' '}
                        <span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span>
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`status-badge ${getTaskStatus(task)}`}>{getTaskStatus(task)}</span>
                      </p>
                      <div className="actions-row">
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => {
                            startEditTask(task)
                            setActivePage('create-task')
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="btn ghost" onClick={() => handleToggleTask(task)}>
                          {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                        <button type="button" className="btn danger" onClick={() => handleDeleteTask(task)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activePage === 'create-task' ? (
              <section className="panel">
              <h2>{editingTaskId ? 'Edit Task' : 'Create Task'}</h2>
              <form className="form-grid" onSubmit={handleCreateTask}>
                <label>
                  Title
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={taskForm.description}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={taskForm.category_id}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, category_id: event.target.value }))}
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
                    value={taskForm.priority}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Due Date
                  <input
                    type="datetime-local"
                    value={taskForm.due_date}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, due_date: event.target.value }))}
                  />
                </label>

                <label>
                  Reminder
                  <select
                    value={taskForm.reminder_days}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, reminder_days: Number(event.target.value) }))}
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div className="actions-row">
                  <button type="submit" className="btn primary">
                    {editingTaskId ? 'Save Changes' : 'Add Task'}
                  </button>
                  {editingTaskId ? (
                    <button type="button" className="btn ghost" onClick={resetTaskForm}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>
              </section>
            ) : null}

            {activePage === 'settings' ? (
              <section className="panel">
              <h2>Settings</h2>
              <div className="actions-row">
                <button type="button" className="btn ghost" onClick={handleSeedDefaultCategories}>
                  Add Project Default Categories
                </button>
              </div>

              <h3 style={{ marginTop: 16, marginBottom: 8 }}>Manage Categories</h3>
              <form className="form-grid" onSubmit={handleCategorySubmit}>
                <label>
                  Category Name
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Color
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, color: event.target.value }))}
                  />
                </label>
                <div className="actions-row">
                  <button type="submit" className="btn primary">
                    {categoryForm.id ? 'Update Category' : 'Add Category'}
                  </button>
                  {categoryForm.id ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setCategoryForm({ name: '', color: '#0b5fff', id: null })}
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>

              <ul className="category-list" style={{ marginTop: 12 }}>
                {categories.map((category) => (
                  <li key={category.id}>
                    <span className="category-dot" style={{ background: category.color }} />
                    <span>{category.name}</span>
                    <span className="category-count">{category.tasks_count ?? 0}</span>
                    <button type="button" className="btn ghost" onClick={() => startEditCategory(category)}>
                      Edit
                    </button>
                    <button type="button" className="btn danger" onClick={() => handleDeleteCategory(category.id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </main>
  )
}

export default App
