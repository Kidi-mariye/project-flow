import { useEffect, useMemo, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  clearStoredToken,
  createTask,
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
  updateTask,
} from './api'
import './App.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const PRIORITY_OPTIONS = ['high', 'medium', 'low']
const STATUS_OPTIONS = ['completed', 'inprogress', 'todo']
const REMINDER_OPTIONS = [
  { label: 'No reminder', value: 0 },
  { label: '1 day before', value: 1 },
  { label: '2 days before', value: 2 },
  { label: '7 days before', value: 7 },
]
const SIDEBAR_LINKS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'manage-tasks', label: 'Manage Projects' },
  { id: 'create-task', label: 'Add Project' },
  { id: 'settings', label: 'Settings' },
]
const PROFILE_IMAGES_KEY = 'task_manager_profile_images'
const SETTINGS_STORAGE_KEY = 'project_flow_settings'

const DEFAULT_SETTINGS = {
  general: {
    languageRegion: 'English (US)',
    timeFormat: '24h',
    theme: 'light',
  },
  projects: {
    defaultPriority: 'medium',
    defaultDueDate: 'none',
    customStatuses: 'todo, inprogress, completed',
    recurringTaskOption: 'weekly',
  },
  notifications: {
    enabled: true,
    reminderTiming: '10',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    channels: {
      email: true,
      sms: false,
      push: true,
    },
  },
  collaboration: {
    projectVisibility: 'private',
    allowComments: true,
    shareByLink: false,
  },
  account: {
    name: '',
    email: '',
    avatarUrl: '',
    twoFactorEnabled: false,
    loginMethod: 'password',
    connectedAccounts: {
      google: false,
      microsoft: false,
      github: false,
    },
  },
  dataSecurity: {
    backupRestore: 'manual',
    cloudSync: 'none',
    retentionDays: '0',
    encryptionLevel: 'standard',
  },
  advanced: {
    developerMode: false,
    apiAccess: false,
    betaFeatures: false,
  },
}

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

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getProfileImageMap() {
  try {
    const raw = localStorage.getItem(PROFILE_IMAGES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getProfileImageForEmail(email) {
  if (!email) {
    return ''
  }

  const map = getProfileImageMap()
  return map[email] || ''
}

function saveProfileImageForEmail(email, imageDataUrl) {
  if (!email || !imageDataUrl) {
    return
  }

  const map = getProfileImageMap()
  map[email] = imageDataUrl
  localStorage.setItem(PROFILE_IMAGES_KEY, JSON.stringify(map))
}

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)

    if (!raw) {
      return DEFAULT_SETTINGS
    }

    const parsed = JSON.parse(raw)

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsed.notifications,
        channels: {
          ...DEFAULT_SETTINGS.notifications.channels,
          ...parsed.notifications?.channels,
        },
      },
      account: {
        ...DEFAULT_SETTINGS.account,
        ...parsed.account,
        connectedAccounts: {
          ...DEFAULT_SETTINGS.account.connectedAccounts,
          ...parsed.account?.connectedAccounts,
        },
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function getTaskStatus(task) {
  if (task.completed) {
    return 'completed'
  }

  if (task.due_date) {
    return 'inprogress'
  }

  return 'todo'
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [registerImageFile, setRegisterImageFile] = useState(null)
  const [registerImagePreview, setRegisterImagePreview] = useState('')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    reminder_days: 0,
  })
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [categories, setCategories] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()))
  const [currentUser, setCurrentUser] = useState(null)
  const [profileImage, setProfileImage] = useState('')
  const [tasks, setTasks] = useState([])
  const [activePage, setActivePage] = useState('dashboard')
  const [settings, setSettings] = useState(() => getStoredSettings())
  const [savedSettings, setSavedSettings] = useState(() => getStoredSettings())
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      void loadPlannerData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const theme = savedSettings.general.theme || 'light'
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-custom')
    document.body.classList.add(`theme-${theme}`)

    return () => {
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-custom')
    }
  }, [savedSettings.general.theme])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    setSettings((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        name: prev.account.name || currentUser.name || '',
        email: prev.account.email || currentUser.email || '',
      },
    }))

    setSavedSettings((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        name: prev.account.name || currentUser.name || '',
        email: prev.account.email || currentUser.email || '',
      },
    }))
  }, [currentUser])

  function updateSettingsSection(section, key, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  function updateNestedSettingsSection(section, nestedSection, key, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...prev[section][nestedSection],
          [key]: value,
        },
      },
    }))
  }

  function handleSaveSettings() {
    setSavedSettings(settings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    setMessage('Settings saved.')
    setError('')
  }

  function handleResetSettings() {
    const resetSettings = {
      ...DEFAULT_SETTINGS,
      account: {
        ...DEFAULT_SETTINGS.account,
        name: currentUser?.name || '',
        email: currentUser?.email || '',
      },
    }

    setSettings(resetSettings)
    setSavedSettings(resetSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(resetSettings))
    setMessage('Settings reset to defaults.')
    setError('')
  }

  function formatDateBySettings(value) {
    if (!value) {
      return 'N/A'
    }

    return new Date(value).toLocaleString([], {
      hour12: savedSettings.general.timeFormat === '12h',
    })
  }

  async function loadPlannerData() {
    setIsLoading(true)
    setError('')

    try {
      const [taskData, categoryData, userData] = await Promise.all([
        fetchFilteredTasks(),
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
      setProfileImage(getProfileImageForEmail(userData?.email || ''))
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not load projects. Please log in again.'))
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

      if (authMode === 'register' && registerImageFile && response?.user?.email) {
        const imageDataUrl = await fileToDataUrl(registerImageFile)
        saveProfileImageForEmail(response.user.email, imageDataUrl)
        setProfileImage(imageDataUrl)
      } else {
        setProfileImage(getProfileImageForEmail(response?.user?.email || ''))
      }

      setRegisterImageFile(null)
      setRegisterImagePreview('')
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
    setProfileImage('')
    setActivePage('dashboard')
    setMessage('Logged out.')
  }

  async function handleRegisterImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      setRegisterImageFile(null)
      setRegisterImagePreview('')
      return
    }

    setRegisterImageFile(file)
    const preview = await fileToDataUrl(file)
    setRegisterImagePreview(preview)
  }

  function resetTaskForm() {
    const defaultStatus = savedSettings.projects.customStatuses
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .find((value) => STATUS_OPTIONS.includes(value)) || 'todo'

    setTaskForm({
      title: '',
      description: '',
      category_id: '',
      priority: savedSettings.projects.defaultPriority,
      status: defaultStatus,
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
      const selectedStatus = taskForm.status || 'todo'
      let normalizedDueDate = taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null

      if (selectedStatus === 'todo') {
        normalizedDueDate = null
      }

      if (selectedStatus === 'inprogress' && !normalizedDueDate) {
        normalizedDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        category_id: taskForm.category_id || null,
        priority: taskForm.priority,
        due_date: normalizedDueDate,
        reminder_at: deriveReminderAt(normalizedDueDate, taskForm.reminder_days),
        completed: selectedStatus === 'completed',
      }

      if (editingTaskId) {
        await updateTask(editingTaskId, payload)
        setMessage('Project updated.')
      } else {
        await createTask(payload)
        setMessage('Project created.')
      }

      resetTaskForm()
      await loadPlannerData()
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not save project.'))
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
      status: getTaskStatus(task),
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
      setMessage('Project updated.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not update project.'))
    }
  }

  async function handleDeleteTask(task) {
    setMessage('')
    setError('')

    try {
      await deleteTask(task.id)
      await loadPlannerData()
      setMessage('Project deleted.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Could not delete project.'))
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
    return [
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
  }, [allTasks])

  const priorityBarData = useMemo(
    () => ({
      labels: priorityChartRows.map((row) => row.label),
      datasets: [
        {
          label: 'Projects',
          data: priorityChartRows.map((row) => row.value),
          backgroundColor: priorityChartRows.map((row) => row.color),
          borderRadius: 8,
          maxBarThickness: 56,
        },
      ],
    }),
    [priorityChartRows],
  )

  const priorityBarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `Projects: ${context.parsed.y}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#374151', font: { weight: 700 } },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1,
            color: '#4b5563',
          },
          grid: { color: 'rgba(100, 116, 139, 0.2)' },
        },
      },
    }),
    [],
  )

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
        <h1 className="project-flow-title">Good morning, mari</h1>
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

            {authMode === 'register' ? (
              <label>
                Upload Profile Image
                <input type="file" accept="image/*" onChange={handleRegisterImageChange} />
                {registerImagePreview ? (
                  <img src={registerImagePreview} alt="Profile preview" className="register-image-preview" />
                ) : null}
              </label>
            ) : null}

            <button type="submit" className="btn primary">
              {authMode === 'register' ? 'Create Account' : 'Login'}
            </button>
          </form>
        </section>
      ) : (
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-profile">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="sidebar-avatar" />
              ) : (
                <div className="sidebar-avatar-fallback">
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="sidebar-profile-text">
                <p className="sidebar-name">{currentUser?.name || 'User'}</p>
                <p className="sidebar-email">{currentUser?.email || 'No email'}</p>
              </div>
            </div>

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
              <section className="page-section">
              <p className="dashboard-greeting">Good Morning, {currentUser?.name || 'User'}</p>

              <div className="metrics-grid">
                <div className="metric-card">
                  <p>Total Projects</p>
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
                  <h3>Project Distribution</h3>
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
                  <div className="bar-graph-wrap">
                    <Bar data={priorityBarData} options={priorityBarOptions} />
                  </div>
                </div>
              </div>

              <div className="dashboard-table panel-soft">
                <h3>Projects Table</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Priority</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTasks.slice(0, 10).map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td><span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span></td>
                        <td>{formatDateBySettings(task.created_at)}</td>
                      </tr>
                    ))}
                    {allTasks.length === 0 ? (
                      <tr>
                        <td colSpan={3}>No projects yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              </section>
            ) : null}

            {activePage === 'manage-tasks' ? (
              <section className="page-section">
                <h2>Manage Projects</h2>

                {isLoading ? <p>Loading...</p> : null}
                {!isLoading && allTasks.length === 0 ? <p>No projects yet.</p> : null}

                <div className="manage-grid">
                  {allTasks.map((task) => (
                    <article key={task.id} className="manage-card">
                      <div className="manage-card-header">
                        <h3 className="manage-card-title">{task.title}</h3>
                        <span className={`status-badge ${getTaskStatus(task)}`}>{getTaskStatus(task)}</span>
                      </div>

                      <p className="manage-card-description">{task.description || 'No description provided.'}</p>

                      <div className="manage-card-meta">
                        <div>
                          <span className="meta-label">Priority</span>
                          <span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span>
                        </div>
                        <div>
                          <span className="meta-label">Category</span>
                          <span className="meta-value">{task.category?.name || 'Uncategorized'}</span>
                        </div>
                        <div>
                          <span className="meta-label">Due</span>
                          <span className="meta-value">{formatDateBySettings(task.due_date)}</span>
                        </div>
                      </div>

                      <div className="actions-row manage-card-actions">
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
              <section className="page-section">
              <h2>{editingTaskId ? 'Edit Project' : 'Add Project'}</h2>
              <form className="form-grid" onSubmit={handleCreateTask}>
                <label>
                  Project Name
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
                  Status
                  <select
                    value={taskForm.status}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
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
                    {editingTaskId ? 'Save Project' : 'Add Project'}
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
              <section className="page-section">
                <h2>Settings</h2>
                <p>Settings content removed.</p>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </main>
  )
}

export default App
