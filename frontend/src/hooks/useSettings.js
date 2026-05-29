import { useState, useCallback } from 'react'
import { fetchUserSettings, updateUserSettings } from '../api'
import { useFetch } from './useFetch'
import { getStoredSettings, saveStoredSettings } from '../utils/helpers'

const DEFAULT_SETTINGS = {
  general: {
    languageRegion: 'English (US)',
    timeFormat: '24h',
    theme: 'light',
  },
  projects: {
    defaultPriority: 'medium',
    defaultDueDate: 'none',
    customStatuses: 'todo, inprogress, completed',
    recurringTaskOption: 'weekly',
  },
  notifications: {
    enabled: true,
    reminderTiming: '10',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    channels: {
      email: true,
      sms: false,
      push: true,
    },
  },
  collaboration: {
    projectVisibility: 'private',
    allowComments: true,
    shareByLink: false,
  },
  account: {
    name: '',
    email: '',
    avatarUrl: '',
    twoFactorEnabled: false,
    loginMethod: 'password',
    connectedAccounts: {
      google: false,
      microsoft: false,
      github: false,
    },
  },
  dataSecurity: {
    backupRestore: 'manual',
    cloudSync: 'none',
    retentionDays: '0',
    encryptionLevel: 'standard',
  },
  advanced: {
    developerMode: false,
    apiAccess: false,
    betaFeatures: false,
  },
}

/**
 * Hook for managing user settings from backend
 * @returns {Object} - { settings, isLoading, error, isSaving, loadSettings, saveSettings, updateSetting }
 */
export function useSettings() {
  const { data: settings, isLoading, error, refetch, setData } = useFetch(
    fetchUserSettings,
    getStoredSettings() || DEFAULT_SETTINGS
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await refetch()
      saveStoredSettings(loaded)
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: loaded }))
      return loaded
    } catch (err) {
      console.error('Failed to load settings:', err)
      // Return defaults if fetch fails
      setData(DEFAULT_SETTINGS)
      saveStoredSettings(DEFAULT_SETTINGS)
    }
  }, [refetch, setData])

  const saveSettings = useCallback(async (newSettings) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const saved = await updateUserSettings(newSettings)
      setData(saved)
      saveStoredSettings(saved)
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: saved }))
      return saved
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [setData])

  const updateSetting = useCallback(async (section, key, value) => {
    const updated = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    }
    return saveSettings(updated)
  }, [settings, saveSettings])

  const updateNestedSetting = useCallback(async (section, nested, key, value) => {
    const updated = {
      ...settings,
      [section]: {
        ...settings[section],
        [nested]: {
          ...settings[section][nested],
          [key]: value,
        },
      },
    }
    return saveSettings(updated)
  }, [settings, saveSettings])

  return {
    settings,
    isLoading,
    error,
    isSaving,
    saveError,
    loadSettings,
    saveSettings,
    updateSetting,
    updateNestedSetting,
  }
}
