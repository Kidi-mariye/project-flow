import { createContext, useState, useEffect } from 'react'
import { 
  getStoredToken, 
  setStoredToken, 
  clearStoredToken,
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser
} from '../api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken()
      if (token) {
        try {
          const user = await fetchCurrentUser()
          setCurrentUser(user)
          setIsAuthenticated(true)
        } catch (err) {
          // Token is invalid, clear it
          clearStoredToken()
          setIsAuthenticated(false)
          setCurrentUser(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await loginUser({ email, password })
      setStoredToken(response.token)
      setCurrentUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await registerUser({ name, email, password, password_confirmation: password })
      setStoredToken(response.token)
      setCurrentUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearStoredToken()
      setIsAuthenticated(false)
      setCurrentUser(null)
    }
  }

  const updateCurrentUser = (nextUser) => {
    setCurrentUser(nextUser)
  }

  const value = {
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    login,
    register,
    logout,
    setCurrentUser: updateCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
