const SETTINGS_STORAGE_KEY = 'project_flow_settings'

const LANGUAGE_REGION_LOCALES = {
  'English (US)': 'en-US',
  'English (UK)': 'en-GB',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage failures
  }
}

export function getLocaleFromSettings(settings = getStoredSettings()) {
  const languageRegion = settings?.general?.languageRegion || 'English (US)'
  return LANGUAGE_REGION_LOCALES[languageRegion] || 'en-US'
}

export function formatDateWithSettings(value, options = {}) {
  if (!value) {
    return 'N/A'
  }

  const storedSettings = getStoredSettings()
  const locale = options.locale || getLocaleFromSettings(storedSettings)

  return new Date(value).toLocaleDateString(locale, options.dateOptions)
}

export function formatDateTime(value, options = {}) {
  if (!value) {
    return 'N/A'
  }

  const storedSettings = getStoredSettings()
  const locale = options.locale || getLocaleFromSettings(storedSettings)
  const timeFormat = options.timeFormat || storedSettings?.general?.timeFormat || '24h'

  return new Date(value).toLocaleString(locale, {
    hour12: timeFormat === '12h',
  })
}

export function getStoredProjectSettings() {
  const settings = getStoredSettings()
  return settings?.projects || null
}

export function getStatusOptionsFromSettings(settings = getStoredSettings()) {
  const customStatuses = settings?.projects?.customStatuses || 'todo, inprogress, completed'
  return customStatuses
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function normalizeDateTimeForInput(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export function deriveReminderAt(dueDate, reminderDays) {
  if (!dueDate || !reminderDays) {
    return null
  }
  const due = new Date(dueDate)
  due.setDate(due.getDate() - Number(reminderDays))
  return due.toISOString()
}

export function getApiErrorMessage(error, fallbackMessage) {
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

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getProfileImageMap() {
  try {
    const raw = localStorage.getItem('task_manager_profile_images')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getProfileImageForEmail(email) {
  if (!email) {
    return ''
  }
  const map = getProfileImageMap()
  return map[email] || ''
}

export function saveProfileImageForEmail(email, imageDataUrl) {
  if (!email || !imageDataUrl) {
    return
  }
  const map = getProfileImageMap()
  map[email] = imageDataUrl
  localStorage.setItem('task_manager_profile_images', JSON.stringify(map))
}

export function getTaskStatus(task) {
  if (task.completed) {
    return 'completed'
  }
  if (task.due_date) {
    return 'inprogress'
  }
  return 'todo'
}
