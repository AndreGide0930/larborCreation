import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

interface Task {
  id: string
  title: string
  urgent: boolean
  important: boolean
  due_date: string
  completed: boolean
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAllTasks = computed(() => tasks.value)
  
  const fetchTasks = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      
      tasks.value = data
    } catch (e) {
      console.error('Error fetching tasks:', e)
      error.value = 'Failed to load tasks'
    } finally {
      loading.value = false
    }
  }

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single()

      if (err) throw err

      tasks.value.unshift(data)
    } catch (e) {
      console.error('Error adding task:', e)
      error.value = 'Failed to add task'
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (err) throw err

      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updates }
      }
    } catch (e) {
      console.error('Error updating task:', e)
      error.value = 'Failed to update task'
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (err) throw err

      tasks.value = tasks.value.filter(t => t.id !== taskId)
    } catch (e) {
      console.error('Error deleting task:', e)
      error.value = 'Failed to delete task'
    } finally {
      loading.value = false
    }
  }

  return {
    tasks,
    loading,
    error,
    getAllTasks,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask
  }
})