import { useAuth } from '../hooks/useAuth'

function SettingsPage() {
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const profileImage = currentUser?.email 
    ? localStorage.getItem(`profile_image_${currentUser.email}`) 
    : ''
  const firstLetter = (currentUser?.name || 'U').charAt(0).toUpperCase()

  return (
    <section className="page-section">
      <h2>Settings</h2>

      <div className="panel-soft" style={{ marginTop: '20px', padding: '20px', borderRadius: '8px' }}>
        <h3>Account Information</h3>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={currentUser?.name}
              style={{ width: '80px', height: '80px', borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
            >
              {firstLetter}
            </div>
          )}
          
          <div>
            <p><strong>Name:</strong> {currentUser?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
            <p><strong>Member since:</strong> {currentUser?.created_at 
              ? new Date(currentUser.created_at).toLocaleDateString() 
              : 'N/A'}</p>
          </div>
        </div>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <h3>Settings Tabs</h3>
        <p style={{ color: '#475569' }}>
          Additional settings for notifications, display preferences, and more will be available here in future updates.
        </p>

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={handleLogout}
            className="btn danger"
            style={{ padding: '10px 20px' }}
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  )
}

export default SettingsPage
