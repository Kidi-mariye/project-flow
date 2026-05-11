import { useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { getNotificationBadgeVariant, getNotificationTypeLabel } from '../utils/notifications'

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications()

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  return (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <h2>Notifications</h2>
          <p className="page-subtitle">Unread: {unreadCount}</p>
        </div>
        <button type="button" className="btn ghost" onClick={markAllAsRead} disabled={!unreadCount}>
          Mark all read
        </button>
      </div>

      {error && <p className="notice error">{error}</p>}
      {isLoading && <p className="notice">Loading notifications...</p>}

      {!isLoading && notifications.length === 0 && <p className="notice">No notifications yet.</p>}

      <div className="notifications-list">
        {notifications.map((item) => (
          <article key={item.id} className={`notification-card ${item.read_at ? 'read' : 'unread'}`}>
            <div className="notification-main">
              <div className="notification-meta-row">
                <span className={`notification-type-badge ${getNotificationBadgeVariant(item.type)}`}>
                  {getNotificationTypeLabel(item.type)}
                </span>
                <span className="notification-time">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}</span>
              </div>
              <div className="notification-title">{item.data?.title || 'Notification'}</div>
              <div className="notification-message">{item.data?.message || 'You have an update.'}</div>
              <div className="notification-meta">
                {item.data?.due_date ? <span>Due: {new Date(item.data.due_date).toLocaleString()}</span> : null}
              </div>
            </div>
            <div className="notification-actions">
              {!item.read_at && (
                <button type="button" className="btn ghost" onClick={() => markAsRead(item.id)}>
                  Mark read
                </button>
              )}
              <button type="button" className="btn danger" onClick={() => removeNotification(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default NotificationsPage