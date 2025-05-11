import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '../utils/request'

interface Task {
  id: number
  title: string
  urgent: boolean
  important: boolean
  dueDate: string
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
      
      const data = await request('/api/tasks')
      tasks.value = data
    } catch (e) {
      console.error('Error fetching tasks:', e)
      error.value = '加载任务失败'
    } finally {
      loading.value = false
    }
  }

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      loading.value = true
      error.value = null

      const data = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
      })

      tasks.value.unshift(data)
    } catch (e) {
      console.error('Error adding task:', e)
      error.value = '添加任务失败'
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      loading.value = true
      error.value = null

      await request(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updates }
      }
    } catch (e) {
      console.error('Error updating task:', e)
      error.value = '更新任务失败'
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      loading.value = true
      error.value = null

      await request(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      tasks.value = tasks.value.filter(t => t.id !== taskId)
    } catch (e) {
      console.error('Error deleting task:', e)
      error.value = '删除任务失败'
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