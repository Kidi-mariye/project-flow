export function getNotificationBadgeVariant(notificationType = '') {
  const normalized = String(notificationType).toLowerCase()

  if (normalized.includes('taskreminder')) return 'reminder'
  if (normalized.includes('task')) return 'task'
  if (normalized.includes('system')) return 'system'
  return 'alert'
}

export function getNotificationTypeLabel(notificationType = '') {
  const shortName = String(notificationType).split('\\').pop() || 'Alert'
  return shortName.replace(/notification/i, '').trim() || 'Alert'
}