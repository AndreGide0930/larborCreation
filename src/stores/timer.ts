import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from './tasks'

export interface TimerTask {
  id: number
  title: string
  description?: string
  priority?: number
  type?: string
  duration: number
  notes: string
  completed: boolean
}

export const useTimerStore = defineStore('timer', () => {
  const router = useRouter()
  const taskStore = useTaskStore()
  
  // 从 localStorage 恢复状态
  const savedTask = localStorage.getItem('activeTask')
  const activeTask = ref<TimerTask | null>(savedTask ? JSON.parse(savedTask) : null)
  const taskNotes = ref('')

  const startTimer = (task: { 
    id: number, 
    title: string,
    description?: string,
    priority?: number,
    type?: string
  }) => {
    console.log('Timer store received task:', task)
    const newTask = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      type: task.type,
      duration: 25, // Default to 25 minutes
      notes: '',
      completed: false
    }
    activeTask.value = newTask
    // 保存到 localStorage
    localStorage.setItem('activeTask', JSON.stringify(newTask))
    console.log('Active task set to:', activeTask.value)
    router.push('/pomodoro')
  }

  const updateTaskNotes = (notes: string) => {
    if (activeTask.value) {
      activeTask.value.notes = notes
      // 更新 localStorage
      localStorage.setItem('activeTask', JSON.stringify(activeTask.value))
    }
  }

  const toggleTaskCompletion = () => {
    if (activeTask.value) {
      activeTask.value.completed = !activeTask.value.completed
      // 更新 localStorage
      localStorage.setItem('activeTask', JSON.stringify(activeTask.value))
      // Update the task in the main task store
      taskStore.updateTask(activeTask.value.id, {
        completed: activeTask.value.completed
      })
    }
  }

  const saveAndClearTimer = () => {
    if (activeTask.value) {
      taskStore.updateTask(activeTask.value.id, {
        completed: activeTask.value.completed
      })
    }
    activeTask.value = null
    taskNotes.value = ''
    // 清除 localStorage
    localStorage.removeItem('activeTask')
  }

  const clearTimer = () => {
    activeTask.value = null
    taskNotes.value = ''
    // 清除 localStorage
    localStorage.removeItem('activeTask')
  }

  return {
    activeTask,
    taskNotes,
    startTimer,
    clearTimer,
    updateTaskNotes,
    toggleTaskCompletion,
    saveAndClearTimer
  }
})