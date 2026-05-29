import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { updateUserProfile } from '../api'
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
  const { currentUser, logout, isAuthenticated, setCurrentUser } = useAuth()
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const actionRef = useRef(null)
  const profileDialogRef = useRef(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileCopyState, setProfileCopyState] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', avatarUrl: '' })
  const [profilePreview, setProfilePreview] = useState('')
  const [profileSaveState, setProfileSaveState] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

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

      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setIsActionOpen(false)
      }

      if (profileDialogRef.current && !profileDialogRef.current.contains(event.target)) {
        setIsProfileOpen(false)
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

  useEffect(() => {
    if (!isProfileOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isProfileOpen])

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  const handleNotifToggle = () => {
    setIsNotifOpen((current) => !current)
  }

  const handleActionToggle = () => {
    setIsActionOpen((current) => !current)
  }

  const openProfileDialog = () => {
    setIsActionOpen(false)
    setProfileCopyState('')
    const initialAvatar = currentUser?.settings?.account?.avatarUrl || (currentUser?.email ? localStorage.getItem(`profile_image_${currentUser.email}`) : '') || ''
    setProfileForm({
      name: currentUser?.name || '',
      avatarUrl: initialAvatar,
    })
    setProfilePreview(initialAvatar)
    setIsProfileOpen(true)
  }

  const closeProfileDialog = () => {
    setIsProfileOpen(false)
    setProfileCopyState('')
    setProfileSaveState('')
    setProfileSaving(false)
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      setProfilePreview(value)
      setProfileForm((current) => ({ ...current, avatarUrl: value }))
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async () => {
    if (!currentUser) {
      return
    }

    setProfileSaving(true)
    setProfileSaveState('')

    try {
      const updatedUser = await updateUserProfile({
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl,
      })

      setCurrentUser(updatedUser)

      if (updatedUser?.email && profileForm.avatarUrl) {
        localStorage.setItem(`profile_image_${updatedUser.email}`, profileForm.avatarUrl)
      }

      setProfileSaveState('Profile updated')
      window.setTimeout(() => {
        setProfileSaveState('')
      }, 1500)
    } catch (error) {
      setProfileSaveState(error?.message || 'Unable to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleCopyEmail = async () => {
    if (!currentUser?.email || !navigator?.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentUser.email)
      setProfileCopyState('Email copied')
      window.setTimeout(() => setProfileCopyState(''), 1400)
    } catch (error) {
      setProfileCopyState('Copy failed')
      window.setTimeout(() => setProfileCopyState(''), 1400)
    }
  }

  const handleNotifKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNotifToggle()
    }
  }

  const handleActionKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActionToggle()
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
    ? (currentUser?.settings?.account?.avatarUrl || localStorage.getItem(`profile_image_${currentUser.email}`) || '')
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

            <span className="topbar-date topbar-date-right">{new Date().toLocaleDateString()}</span>

            <div className="topbar-action-wrap" ref={actionRef}>
              <button
                type="button"
                className="topbar-action"
                aria-label="Open top bar actions"
                aria-haspopup="menu"
                aria-expanded={isActionOpen}
                onClick={handleActionToggle}
                onKeyDown={handleActionKeyDown}
              >
                <span aria-hidden="true">⋯</span>
              </button>

              {isActionOpen ? (
                <div className="topbar-action-dropdown" role="menu" aria-label="Top bar actions">
                  <button type="button" className="topbar-action-item" onClick={openProfileDialog}>
                    My Profile
                  </button>
                  <button type="button" className="topbar-action-item danger" onClick={async () => { setIsActionOpen(false); await handleLogout() }}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
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

        </aside>

        <div className="dashboard-content">
          {children}
        </div>
      </div>

      {isProfileOpen ? (
        <div className="profile-modal-overlay" role="presentation" onClick={closeProfileDialog}>
          <div
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            ref={profileDialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="profile-modal-kicker">My Profile</p>
                <h3 id="profile-modal-title">Account details</h3>
              </div>
              <button type="button" className="profile-modal-close" onClick={closeProfileDialog} aria-label="Close profile dialog">
                ×
              </button>
            </div>

              <div className="profile-modal-body profile-modal-body--editable">
                <div className="profile-modal-avatar-wrap">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="profile-modal-avatar" />
                  ) : (
                    <div className="profile-modal-avatar profile-modal-avatar-fallback">{firstLetter}</div>
                  )}
                </div>

                <div className="profile-modal-details">
                  <div className="profile-modal-field">
                    <label className="profile-modal-label" htmlFor="profile-name">Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      className="profile-modal-input"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>

                  <div className="profile-modal-field">
                    <span className="profile-modal-label">Email</span>
                    <span className="profile-modal-value profile-modal-email">{currentUser?.email || 'No email'}</span>
                  </div>

                  <div className="profile-modal-field">
                    <label className="profile-modal-label" htmlFor="profile-avatar">Avatar</label>
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/*"
                      className="profile-modal-file"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" className="profile-modal-btn" onClick={handleCopyEmail} disabled={!currentUser?.email}>
                  Copy Email
                </button>
                <button type="button" className="profile-modal-btn primary" onClick={handleProfileSave} disabled={profileSaving || !profileForm.name.trim()}>
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" className="profile-modal-btn" onClick={() => { closeProfileDialog(); navigate('/settings', { state: { activeTab: 'account' } }) }}>
                  Open Settings
                </button>
                <button type="button" className="profile-modal-btn" onClick={closeProfileDialog}>
                  Close
                </button>
              </div>

              {profileCopyState ? <p className="profile-modal-feedback">{profileCopyState}</p> : null}
              {profileSaveState ? <p className="profile-modal-feedback">{profileSaveState}</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default RootLayout
