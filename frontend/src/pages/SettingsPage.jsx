import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'

function SettingsPage() {
  const { currentUser, logout } = useAuth()
  const { settings, isLoading, error, isSaving, saveError, loadSettings, updateSetting } = useSettings()
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const handleSettingChange = async (section, key, value) => {
    try {
      await updateSetting(section, key, value)
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to update setting:', err)
    }
  }

  const profileImage = currentUser?.email 
    ? localStorage.getItem(`profile_image_${currentUser.email}`) 
    : ''
  const firstLetter = (currentUser?.name || 'U').charAt(0).toUpperCase()

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'projects', label: 'Projects' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'collaboration', label: 'Collaboration' },
    { id: 'account', label: 'Account' },
    { id: 'dataSecurity', label: 'Data & Security' },
    { id: 'advanced', label: 'Advanced' },
  ]

  if (isLoading) {
    return <section className="page-section"><p>Loading settings...</p></section>
  }

  return (
    <section className="page-section">
      <h2>Settings</h2>

      {/* Account Information Panel */}
      <div className="panel-soft" style={{ marginTop: '20px', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
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

      {/* Settings Tabs */}
      <div className="panel-soft" style={{ padding: '20px', borderRadius: '8px' }}>
        <h3>Preferences</h3>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab-row active' : 'tab-row'}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#f0f9ff' : 'transparent',
                color: activeTab === tab.id ? '#0284c7' : '#475569',
                borderBottom: activeTab === tab.id ? '2px solid #0284c7' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="notice" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
            Error loading settings: {error}
          </div>
        )}
        {saveError && (
          <div className="notice" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
            Error saving settings: {saveError}
          </div>
        )}

        {/* Tab Content */}
        <div style={{ marginTop: '20px' }}>
          {activeTab === 'general' && settings?.general && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label>Language & Region</label>
                <select 
                  value={settings.general.languageRegion || 'English (US)'}
                  onChange={(e) => handleSettingChange('general', 'languageRegion', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Time Format</label>
                <select 
                  value={settings.general.timeFormat || '24h'}
                  onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="24h">24-hour</option>
                  <option value="12h">12-hour</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Theme</label>
                <select 
                  value={settings.general.theme || 'light'}
                  onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'projects' && settings?.projects && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label>Default Priority</label>
                <select 
                  value={settings.projects.defaultPriority || 'medium'}
                  onChange={(e) => handleSettingChange('projects', 'defaultPriority', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Default Due Date</label>
                <select 
                  value={settings.projects.defaultDueDate || 'none'}
                  onChange={(e) => handleSettingChange('projects', 'defaultDueDate', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="none">None</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">Next Week</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && settings?.notifications && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.notifications.enabled || false}
                  onChange={(e) => handleSettingChange('notifications', 'enabled', e.target.checked)}
                  id="notif-enabled"
                />
                <label htmlFor="notif-enabled" style={{ marginBottom: 0 }}>Enable Notifications</label>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Reminder Timing (minutes before)</label>
                <input 
                  type="number" 
                  value={settings.notifications.reminderTiming || '10'}
                  onChange={(e) => handleSettingChange('notifications', 'reminderTiming', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && settings?.collaboration && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label>Project Visibility</label>
                <select 
                  value={settings.collaboration.projectVisibility || 'private'}
                  onChange={(e) => handleSettingChange('collaboration', 'projectVisibility', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared with Team</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.collaboration.allowComments || false}
                  onChange={(e) => handleSettingChange('collaboration', 'allowComments', e.target.checked)}
                  id="collab-comments"
                />
                <label htmlFor="collab-comments" style={{ marginBottom: 0 }}>Allow Comments</label>
              </div>
            </div>
          )}

          {activeTab === 'account' && settings?.account && (
            <div>
              <p style={{ color: '#475569', marginBottom: '20px' }}>
                Account settings are managed from your profile. To change your name or email, please update your profile.
              </p>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.account.twoFactorEnabled || false}
                  onChange={(e) => handleSettingChange('account', 'twoFactorEnabled', e.target.checked)}
                  id="account-2fa"
                  disabled
                />
                <label htmlFor="account-2fa" style={{ marginBottom: 0, color: '#94a3b8' }}>Two-Factor Authentication (Coming Soon)</label>
              </div>
            </div>
          )}

          {activeTab === 'dataSecurity' && settings?.dataSecurity && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label>Encryption Level</label>
                <select 
                  value={settings.dataSecurity.encryptionLevel || 'standard'}
                  onChange={(e) => handleSettingChange('dataSecurity', 'encryptionLevel', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="standard">Standard</option>
                  <option value="enhanced">Enhanced</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Data Retention (days, 0 = indefinite)</label>
                <input 
                  type="number" 
                  value={settings.dataSecurity.retentionDays || '0'}
                  onChange={(e) => handleSettingChange('dataSecurity', 'retentionDays', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && settings?.advanced && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.advanced.developerMode || false}
                  onChange={(e) => handleSettingChange('advanced', 'developerMode', e.target.checked)}
                  id="adv-dev"
                />
                <label htmlFor="adv-dev" style={{ marginBottom: 0 }}>Developer Mode</label>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.advanced.betaFeatures || false}
                  onChange={(e) => handleSettingChange('advanced', 'betaFeatures', e.target.checked)}
                  id="adv-beta"
                />
                <label htmlFor="adv-beta" style={{ marginBottom: 0 }}>Enable Beta Features</label>
              </div>
            </div>
          )}
        </div>

        {isSaving && (
          <div style={{ marginTop: '20px', color: '#0284c7' }}>
            Saving changes...
          </div>
        )}
      </div>
    </section>
  )
}

export default SettingsPage

