import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Task {
  id: number
  title: string
  urgent: boolean
  important: boolean
  dueDate: string
  completed: boolean
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([
    {
      id: 1,
      title: 'Complete Math Assignment',
      urgent: true,
      important: true,
      dueDate: '2024-02-25',
      completed: false
    }
  ])

  const getAllTasks = computed(() => tasks.value)
  
  const addTask = (task: Omit<Task, 'id'>) => {
    tasks.value.push({
      ...task,
      id: Date.now()
    })
  }

  const updateTask = (taskId: number, updates: Partial<Task>) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      Object.assign(task, updates)
    }
  }

  const deleteTask = (taskId: number) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  return {
    tasks,
    getAllTasks,
    addTask,
    updateTask,
    deleteTask
  }
})