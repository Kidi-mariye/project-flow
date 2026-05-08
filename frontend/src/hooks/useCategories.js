import { useCallback, useState } from 'react'
import { fetchCategories, seedDefaultCategories } from '../api'
import { useFetch } from './useFetch'

/**
 * Hook for managing categories
 * @returns {Object} - { categories, isLoading, error, loadCategories, seedDefaults }
 */
export function useCategories() {
  const { data: categories, isLoading, error, refetch, setData } = useFetch(fetchCategories, [])
  const [isSeeding, setIsSeeding] = useState(false)

  const loadCategories = useCallback(async () => {
    return refetch()
  }, [refetch])

  const seedDefaults = useCallback(async () => {
    setIsSeeding(true)
    try {
      const defaultCategories = await seedDefaultCategories()
      setData(defaultCategories)
      return defaultCategories
    } finally {
      setIsSeeding(false)
    }
  }, [setData])

  return {
    categories,
    isLoading,
    error,
    isSeeding,
    loadCategories,
    seedDefaults,
  }
}
