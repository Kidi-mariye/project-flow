import { useState, useCallback } from 'react'
import { 
  fetchPagedTasks,
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
  const { data: taskState, isLoading, error, refetch, setData } = useFetch(fetchPagedTasks, {
    items: [],
    meta: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const tasks = taskState?.items ?? []
  const meta = taskState?.meta ?? null

  const loadTasks = useCallback(async (filters = {}) => {
    return refetch(filters)
  }, [refetch])

  const addTask = useCallback(async (payload) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const newTask = await createTask(payload)
      setData((current) => ({
        ...current,
        items: [newTask, ...(current?.items ?? [])],
      }))
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
      setData((current) => ({
        ...current,
        items: (current?.items ?? []).map((task) => (task.id === taskId ? updated : task)),
      }))
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
      setData((current) => ({
        ...current,
        items: (current?.items ?? []).filter((task) => task.id !== taskId),
      }))
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
    meta,
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
