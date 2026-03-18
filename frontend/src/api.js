import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'task_manager_token'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const token = getStoredToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
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
  const { data } = await api.post('/auth/logout', {}, { headers: authHeaders() })
  return data
}

export async function fetchTasks() {
  const { data } = await api.get('/tasks', { headers: authHeaders() })
  return data
}

export async function fetchFilteredTasks(filters = {}) {
  const { data } = await api.get('/tasks', {
    headers: authHeaders(),
    params: filters,
  })
  return data
}

export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload, { headers: authHeaders() })
  return data
}

export async function updateTask(taskId, payload) {
  const { data } = await api.put(`/tasks/${taskId}`, payload, { headers: authHeaders() })
  return data
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/tasks/${taskId}`, { headers: authHeaders() })
  return data
}

export async function fetchCategories() {
  const { data } = await api.get('/categories', { headers: authHeaders() })
  return data
}

export async function seedDefaultCategories() {
  const { data } = await api.post('/categories/seed-defaults', {}, { headers: authHeaders() })
  return data
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload, { headers: authHeaders() })
  return data
}

export async function updateCategory(categoryId, payload) {
  const { data } = await api.put(`/categories/${categoryId}`, payload, { headers: authHeaders() })
  return data
}

export async function deleteCategory(categoryId) {
  const { data } = await api.delete(`/categories/${categoryId}`, { headers: authHeaders() })
  return data
}

export async function fetchDashboardMetrics() {
  const { data } = await api.get('/dashboard/metrics', { headers: authHeaders() })
  return data
}
