import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
