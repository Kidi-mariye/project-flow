import { useState, useCallback } from 'react'

/**
 * Generic fetch hook for data fetching with loading and error states
 * @param {Function} fetchFn - The API function to call
 * @param {*} initialData - Initial data value
 * @returns {Object} - { data, isLoading, error, refetch }
 */
export function useFetch(fetchFn, initialData = null) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async (...args) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn])

  return { data, isLoading, error, refetch, setData, setError }
}
