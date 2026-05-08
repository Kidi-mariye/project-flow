import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../App.css'

const SIDEBAR_LINKS = [
  { id: '/dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: '/tasks', label: 'Manage Projects', path: '/tasks' },
  { id: '/create-task', label: 'Add Project', path: '/create-task' },
  { id: '/settings', label: 'Settings', path: '/settings' },
]

function RootLayout({ children }) {
  const { currentUser, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
      <header className="topbar">
        <h1 className="project-flow-title">Good morning, {(currentUser?.name || 'User').split(' ')[0].toLowerCase()}</h1>
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
