import { useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import {
  clearStoredToken,
  createCategory,
  createTask,
  deleteCategory,
  deleteTask,
  fetchCategories,
  fetchDashboardMetrics,
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
  { id: 'section-reminders', label: 'Reminders' },
  { id: 'section-metrics', label: 'Metrics Dashboard' },
  { id: 'section-categories', label: 'Categories & Filters' },
  { id: 'section-create-task', label: 'Create Task' },
  { id: 'section-tasks', label: 'Your Tasks' },
  { id: 'section-calendar', label: 'Calendar View' },
]

function formatDateTime(value) {
  if (!value) {
    return 'No deadline'
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

function sameDate(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
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
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()))
  const [tasks, setTasks] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [activeSection, setActiveSection] = useState(SIDEBAR_LINKS[0].id)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      void loadPlannerData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const sections = SIDEBAR_LINKS
      .map((item) => document.getElementById(item.id))
      .filter(Boolean)

    if (sections.length === 0) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id)
        }
      },
      {
        threshold: 0.25,
        rootMargin: '-20% 0px -60% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
      observer.disconnect()
    }
  }, [isAuthenticated])

  async function loadPlannerData(activeFilters = filters) {
    setIsLoading(true)
    setError('')

    try {
      const [taskData, categoryData, metricData] = await Promise.all([
        fetchFilteredTasks(activeFilters),
        fetchCategories(),
        fetchDashboardMetrics(),
      ])

      let finalCategories = categoryData

      if (categoryData.length === 0) {
        finalCategories = await seedDefaultCategories()
      }

      setTasks(taskData)
      setCategories(finalCategories)
      setMetrics(metricData)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not load tasks. Please log in again.'))
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

      let response

      if (authMode === 'register') {
        response = await registerUser({
          ...payload,
          name: authForm.name,
        })
      } else {
        response = await loginUser(payload)
      }

      setStoredToken(response.token)
      setIsAuthenticated(true)
      setAuthForm({ name: '', email: '', password: '' })
      setMessage(authMode === 'register' ? 'Account created.' : 'Logged in successfully.')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Authentication failed. Check your details and try again.'))
    }
  }

  async function handleLogout() {
    setMessage('')
    setError('')

    try {
      await logoutUser()
    } catch {
      // Even if token is already invalid, clear local state.
    }

    clearStoredToken()
    setIsAuthenticated(false)
    setTasks([])
      setCategories([])
      setMetrics(null)
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
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not save task.'))
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
      const updated = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        category_id: task.category_id,
        priority: task.priority,
        due_date: task.due_date,
        reminder_at: task.reminder_at,
        completed: !task.completed,
      })

      setTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      await loadPlannerData()
      setMessage('Task updated.')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not update task.'))
    }
  }

  async function handleDeleteTask(taskId) {
    setMessage('')
    setError('')

    try {
      await deleteTask(taskId)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      await loadPlannerData()
      setMessage('Task deleted.')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not delete task.'))
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
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not save category.'))
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
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not delete category. Remove linked tasks first or reassign them.'))
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
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not add default project categories.'))
    }
  }

  const reminders = useMemo(
    () => tasks.filter((task) => !task.completed && task.reminder_at && new Date(task.reminder_at) <= new Date()),
    [tasks],
  )

  const selectedDateTasks = useMemo(
    () => tasks.filter((task) => task.due_date && sameDate(new Date(task.due_date), selectedDate)),
    [tasks, selectedDate],
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Task Manager</p>
          <h1>React + Laravel API</h1>
        </div>
        {isAuthenticated ? (
          <button type="button" className="btn ghost" onClick={handleLogout}>
            Logout
          </button>
        ) : null}
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
                    <a
                      href={`#${item.id}`}
                      className={activeSection === item.id ? 'active' : ''}
                      onClick={() => setActiveSection(item.id)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="dashboard-content">
            <section id="section-reminders" className="panel reminder-panel">
              <h2>Reminders</h2>
              {reminders.length === 0 ? <p>No reminders right now.</p> : null}
              <ul className="reminder-list">
                {reminders.map((task) => (
                  <li key={task.id}>
                    <strong>{task.title}</strong> reminder triggered for {formatDateTime(task.reminder_at)}
                  </li>
                ))}
              </ul>
            </section>

            <section id="section-metrics" className="panel metrics-grid">
              <div className="metric-card">
                <p>Total Tasks</p>
                <h3>{metrics?.total_tasks ?? 0}</h3>
              </div>
              <div className="metric-card">
                <p>Completed</p>
                <h3>{metrics?.completed_tasks ?? 0}</h3>
              </div>
              <div className="metric-card">
                <p>Active Courses</p>
                <h3>{metrics?.active_courses ?? 0}</h3>
              </div>
              <div className="metric-card">
                <p>Upcoming Deadlines (7 days)</p>
                <h3>{metrics?.upcoming_deadlines ?? 0}</h3>
              </div>
            </section>

            <section id="section-create-task" className="panel">
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
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                  }
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
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
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
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
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
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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

            <section id="section-tasks" className="panel">
            <h2>Your Tasks</h2>
            {isLoading ? <p>Loading...</p> : null}

            {!isLoading && tasks.length === 0 ? <p>No tasks yet.</p> : null}

            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? 'is-complete' : ''} ${!task.completed && task.due_date && new Date(task.due_date) < new Date() ? 'is-overdue' : ''}`}
                >
                  <div>
                    <h3 className={task.completed ? 'done' : ''}>{task.title}</h3>
                    <p>{task.description || 'No description'}</p>
                    <p>
                      <strong>Course:</strong> {task.category?.name || 'Uncategorized'}
                    </p>
                    <p>
                      <strong>Due:</strong> {formatDateTime(task.due_date)}
                    </p>
                    <p>
                      <strong>Priority:</strong> <span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span>
                    </p>
                  </div>

                  <div className="actions">
                    <button type="button" className="btn ghost" onClick={() => startEditTask(task)}>
                      Edit
                    </button>
                    <button type="button" className="btn ghost" onClick={() => handleToggleTask(task)}>
                      {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            </section>

            <section id="section-categories" className="panel two-col">
            <div>
              <h2>Categories / Courses</h2>
              <div className="actions-row" style={{ marginBottom: 12 }}>
                <button type="button" className="btn ghost" onClick={handleSeedDefaultCategories}>
                  Add Project Default Categories
                </button>
              </div>
              <form className="form-grid" onSubmit={handleCategorySubmit}>
                <label>
                  Course Name
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

              <ul className="category-list">
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
            </div>

            <div>
              <h2>Task Filters</h2>
              <form className="form-grid" onSubmit={handleApplyFilters}>
                <label>
                  Category
                  <select
                    value={filters.category_id}
                    onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value }))}
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={filters.priority}
                    onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    <option value="">All priorities</option>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={filters.completed}
                    onChange={(event) => setFilters((prev) => ({ ...prev, completed: event.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="false">Pending</option>
                    <option value="true">Completed</option>
                  </select>
                </label>

                <div className="actions-row">
                  <button type="submit" className="btn primary">Apply Filters</button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      const reset = { category_id: '', priority: '', completed: '' }
                      setFilters(reset)
                      void loadPlannerData(reset)
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
            </section>

            <section id="section-calendar" className="panel two-col">
            <div>
              <h2>Calendar View</h2>
              <Calendar
                onChange={(value) => setSelectedDate(value)}
                value={selectedDate}
                tileContent={({ date, view }) => {
                  if (view !== 'month') {
                    return null
                  }

                  const count = tasks.filter((task) => task.due_date && sameDate(new Date(task.due_date), date)).length
                  return count > 0 ? <span className="day-count">{count}</span> : null
                }}
              />
            </div>

            <div>
              <h2>Deadlines on {selectedDate.toLocaleDateString()}</h2>
              {selectedDateTasks.length === 0 ? <p>No deadlines.</p> : null}
              <ul className="deadline-list">
                {selectedDateTasks.map((task) => (
                  <li key={task.id}>
                    <span>{task.title}</span>
                    <span className={`priority ${task.priority}`}>{task.priority}</span>
                  </li>
                ))}
              </ul>
            </div>
            </section>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
