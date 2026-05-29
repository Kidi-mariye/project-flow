import axios from 'axios'

// Use VITE_API_BASE_URL when provided; otherwise use relative `/api` so the
// Vite dev server proxy can forward requests to the backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_KEY = 'task_manager_token'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor - Auto-attach auth headers
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor - Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      clearStoredToken()
      // Dispatch custom event for AuthContext to listen to
      window.dispatchEvent(new Event('auth-expired'))
      // Optionally redirect to login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Don't redirect here, let the app handle it through context
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      error.message = 'You do not have permission to access this resource'
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      error.message = 'Resource not found'
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      const validationErrors = error.response?.data?.errors || {}
      const firstError = Object.values(validationErrors)[0]
      if (Array.isArray(firstError) && firstError.length > 0) {
        error.message = firstError[0]
      } else {
        error.message = error.response?.data?.message || 'Validation failed'
      }
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.'
    }

    // Handle Network Error
    if (error.code === 'ERR_NETWORK' || !error.response) {
      error.message = 'Network error. Please check your connection and ensure the API server is running.'
    }

    return Promise.reject(error)
  }
)

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout', {})
  return data
}

export async function fetchTasks() {
  const { data } = await api.get('/tasks')
  return data
}

export async function fetchFilteredTasks(filters = {}) {
  const { data } = await api.get('/tasks', {
    params: filters,
  })
  return data.data ?? data
}

export async function fetchPagedTasks(filters = {}) {
  const { data } = await api.get('/tasks', {
    params: filters,
  })

  return {
    items: data.data ?? data,
    meta: data.meta ?? null,
  }
}

export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload)
  return data
}

export async function updateTask(taskId, payload) {
  const { data } = await api.put(`/tasks/${taskId}`, payload)
  return data
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/tasks/${taskId}`)
  return data
}

export async function fetchCategories() {
  const { data } = await api.get('/categories')
  return data
}

export async function seedDefaultCategories() {
  const { data } = await api.post('/categories/seed-defaults', {})
  return data
}

export async function fetchDashboardMetrics() {
  const { data } = await api.get('/dashboard/metrics')
  return data
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/user')
  return data
}

// Settings endpoints
export async function fetchUserSettings() {
  const { data } = await api.get('/user/settings')
  return data.data ?? data
}

export async function updateUserSettings(settings) {
  const { data } = await api.put('/user/settings', settings)
  return data.data ?? data
}

export async function updateUserProfile(profile) {
  const { data } = await api.put('/user/profile', profile)
  return data.data?.user ?? data.data ?? data
}

export async function fetchNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params })
  return data
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await api.post(`/notifications/${notificationId}/read`)
  return data
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.post('/notifications/read-all')
  return data
}

export async function deleteNotification(notificationId) {
  const { data } = await api.delete(`/notifications/${notificationId}`)
  return data
}
