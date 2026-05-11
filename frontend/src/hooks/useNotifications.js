import { useCallback, useState } from 'react'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadNotifications = useCallback(async (params = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchNotifications(params)
      setNotifications(response.data || [])
      setMeta(response.meta || null)
      return response
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    await markNotificationAsRead(notificationId)
    setNotifications((current) => current.map((item) => (
      item.id === notificationId ? { ...item, read_at: item.read_at || new Date().toISOString() } : item
    )))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead()
    setNotifications((current) => current.map((item) => ({
      ...item,
      read_at: item.read_at || new Date().toISOString(),
    })))
  }, [])

  const removeNotification = useCallback(async (notificationId) => {
    await deleteNotification(notificationId)
    setNotifications((current) => current.filter((item) => item.id !== notificationId))
  }, [])

  const unreadCount = meta?.unread_count ?? notifications.filter((item) => !item.read_at).length

  return {
    notifications,
    meta,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  }
}