export function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }
  return new Date(value).toLocaleString()
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
