import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { getNotificationBadgeVariant, getNotificationTypeLabel } from '../utils/notifications'
import '../App.css'

const SIDEBAR_LINKS = [
  { id: '/dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: '/tasks', label: 'Manage Projects', path: '/tasks' },
  { id: '/create-task', label: 'Add Project', path: '/create-task' },
  { id: '/notifications', label: 'Notifications', path: '/notifications' },
  { id: '/settings', label: 'Settings', path: '/settings' },
]

function RootLayout({ children }) {
  const { currentUser, logout, isAuthenticated } = useAuth()
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications({ unread_only: true, per_page: 1 })
    }
  }, [isAuthenticated, loadNotifications])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isNotifOpen) {
      loadNotifications({ per_page: 5 })
    }
  }, [isNotifOpen, loadNotifications])

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  const handleNotifToggle = () => {
    setIsNotifOpen((current) => !current)
  }

  const handleNotifKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNotifToggle()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return children
  }

  const profileImage = currentUser?.email 
    ? localStorage.getItem(`profile_image_${currentUser.email}`) 
    : ''
  const firstLetter = (currentUser?.name || 'U').charAt(0).toUpperCase()

  return (
    <main className="app-shell">
      <header className="main-topbar">
        <div className="main-topbar-inner">
          <div className="topbar-left">
            <div className="topbar-welcome">
              <span className="topbar-greeting">Welcome,</span>
              <span className="topbar-username">{currentUser?.name || 'User'}</span>
            </div>
          </div>
          <div className="topbar-right">
          <div className="topbar-notif-wrap" ref={dropdownRef}>
            <div
              className="topbar-notif"
              aria-label="Notifications"
              onClick={handleNotifToggle}
              onKeyDown={handleNotifKeyDown}
              role="button"
              tabIndex={0}
              aria-expanded={isNotifOpen}
              aria-haspopup="menu"
            >
              <span className="topbar-notif-icon" aria-hidden="true">🔔</span>
              {unreadCount > 0 && <span className="notif-dot" />}
            </div>
            {isNotifOpen && (
              <div className="notif-dropdown" role="menu" aria-label="Notifications list">
                <div className="notif-dropdown-header">
                  <div>
                    <div className="notif-dropdown-title">Notifications</div>
                    <div className="notif-dropdown-subtitle">Unread: {unreadCount}</div>
                  </div>
                  <div className="notif-dropdown-actions">
                    <button
                      type="button"
                      className="notif-link"
                      onClick={async () => {
                        await markAllAsRead()
                        setIsNotifOpen(false)
                      }}
                      disabled={unreadCount === 0}
                    >
                      Mark all read
                    </button>
                    <button type="button" className="notif-link" onClick={() => navigate('/notifications')}>
                      View all
                    </button>
                  </div>
                </div>

                <div className="notif-dropdown-list">
                  {recentNotifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet.</div>
                  ) : recentNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`notif-item ${item.read_at ? 'read' : 'unread'}`}
                      onClick={async () => {
                        if (!item.read_at) {
                          await markAsRead(item.id)
                        }
                        setIsNotifOpen(false)
                        navigate('/notifications')
                      }}
                    >
                      <span className="notif-item-dot" />
                      <span className="notif-item-body">
                        <span className="notif-item-meta-row">
                          <span className={`notif-type-badge ${getNotificationBadgeVariant(item.type)}`}>
                            {getNotificationTypeLabel(item.type)}
                          </span>
                          <span className="notif-item-time">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}</span>
                        </span>
                        <span className="notif-item-title">{item.data?.title || 'Notification'}</span>
                        <span className="notif-item-message">{item.data?.message || 'Tap to open details.'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="topbar-date">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-profile">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar-fallback">{firstLetter}</div>
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
                    className={location.pathname === item.path ? 'active' : ''}
                    onClick={() => navigate(item.path)}
                    style={{ width: '100%', textAlign: 'left' }}
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
          {children}
        </div>
      </div>
    </main>
  )
}

export default RootLayout
