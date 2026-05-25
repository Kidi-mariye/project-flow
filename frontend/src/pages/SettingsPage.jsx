import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'

function SettingsPage() {
  const { settings, isLoading, error, isSaving, saveError, loadSettings, updateSetting } = useSettings()
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSettingChange = async (section, key, value) => {
    try {
      await updateSetting(section, key, value)
    } catch (err) {
      console.error('Failed to update setting:', err)
    }
  }

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

      {/* Settings Tabs */}
      <div className="panel-soft settings-panel">
        <h3>Preferences</h3>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', paddingBottom: '10px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab-btn active' : 'tab-btn'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Messages */}
          {error && (
            <div className="notice error notice-inline-error">
              Error loading settings: {error}
            </div>
          )}
          {saveError && (
            <div className="notice error notice-inline-error">
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
                  className="form-input"
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
                  className="form-input"
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
                  className="form-input"
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
                  className="form-input"
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
                  className="form-input"
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
              <div className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled || false}
                  onChange={(e) => handleSettingChange('notifications', 'enabled', e.target.checked)}
                  id="notif-enabled"
                  className="settings-toggle-input"
                />
                <label htmlFor="notif-enabled" className="settings-toggle-label">
                  Enable Notifications
                </label>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Reminder Timing (minutes before)</label>
                <input 
                  type="number" 
                  value={settings.notifications.reminderTiming || '10'}
                  onChange={(e) => handleSettingChange('notifications', 'reminderTiming', e.target.value)}
                  className="form-input"
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
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid var(--slate-300)' }}
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared with Team</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={settings.collaboration.allowComments || false}
                  onChange={(e) => handleSettingChange('collaboration', 'allowComments', e.target.checked)}
                  id="collab-comments"
                  className="settings-toggle-input"
                />
                <label htmlFor="collab-comments" className="settings-toggle-label">
                  Allow Comments
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && settings?.account && (
            <div>
              <p style={{ color: 'var(--slate-700)', marginBottom: '20px' }}>
                Account settings are managed from your profile. To change your name or email, please update your profile.
              </p>
              <div className="settings-toggle-row settings-toggle-row--disabled">
                <input
                  type="checkbox"
                  checked={settings.account.twoFactorEnabled || false}
                  onChange={(e) => handleSettingChange('account', 'twoFactorEnabled', e.target.checked)}
                  id="account-2fa"
                  className="settings-toggle-input"
                  disabled
                />
                <label htmlFor="account-2fa" className="settings-toggle-label settings-toggle-label--disabled">
                  Two-Factor Authentication (Coming Soon)
                </label>
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
                  className="form-input"
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
                  className="form-input"
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && settings?.advanced && (
            <div>
              <div className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={settings.advanced.developerMode || false}
                  onChange={(e) => handleSettingChange('advanced', 'developerMode', e.target.checked)}
                  id="adv-dev"
                  className="settings-toggle-input"
                />
                <label htmlFor="adv-dev" className="settings-toggle-label">
                  Developer Mode
                </label>
              </div>

              <div className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={settings.advanced.betaFeatures || false}
                  onChange={(e) => handleSettingChange('advanced', 'betaFeatures', e.target.checked)}
                  id="adv-beta"
                  className="settings-toggle-input"
                />
                <label htmlFor="adv-beta" className="settings-toggle-label">
                  Enable Beta Features
                </label>
              </div>
            </div>
          )}
        </div>

        {isSaving && (
          <div style={{ marginTop: '20px', color: 'var(--primary-500)' }}>
            Saving changes...
          </div>
        )}
      </div>
    </section>
  )
}

export default SettingsPage

