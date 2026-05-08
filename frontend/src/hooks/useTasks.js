import { useState, useCallback } from 'react'
import { 
  fetchFilteredTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../api'
import { useFetch } from './useFetch'

/**
 * Hook for managing tasks with CRUD operations
 * @returns {Object} - { tasks, isLoading, error, loadTasks, addTask, editTask, removeTask, toggleTask }
 */
export function useTasks() {
  const { data: tasks, isLoading, error, refetch, setData } = useFetch(fetchFilteredTasks, [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const loadTasks = useCallback(async (filters = {}) => {
    return refetch(filters)
  }, [refetch])

  const addTask = useCallback(async (payload) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const newTask = await createTask(payload)
      setData([...tasks, newTask])
      return newTask
    } catch (err) {
      setSubmitError(err.message || 'Failed to create task')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [tasks, setData])

  const editTask = useCallback(async (taskId, payload) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await updateTask(taskId, payload)
      setData(tasks.map(t => t.id === taskId ? updated : t))
      return updated
    } catch (err) {
      setSubmitError(err.message || 'Failed to update task')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [tasks, setData])

  const removeTask = useCallback(async (taskId) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await deleteTask(taskId)
      setData(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      setSubmitError(err.message || 'Failed to delete task')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [tasks, setData])

  const toggleTask = useCallback(async (task) => {
    return editTask(task.id, {
      ...task,
      completed: !task.completed,
    })
  }, [editTask])

  return {
    tasks,
    isLoading,
    error,
    isSubmitting,
    submitError,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    toggleTask,
  }
}
