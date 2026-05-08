import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import RootLayout from './components/RootLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CreateTaskPage from './pages/CreateTaskPage'
import SettingsPage from './pages/SettingsPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RootLayout>
              <DashboardPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <RootLayout>
              <TasksPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-task"
        element={
          <ProtectedRoute>
            <RootLayout>
              <CreateTaskPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RootLayout>
              <SettingsPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  </StrictMode>,
)
