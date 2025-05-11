import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from './tasks'

export interface TimerTask {
  id: number
  title: string
  duration: number
  notes: string
  completed: boolean
}

export const useTimerStore = defineStore('timer', () => {
  const router = useRouter()
  const taskStore = useTaskStore()
  
  const activeTask = ref<TimerTask | null>(null)
  const taskNotes = ref('')

  const startTimer = (task: { id: number, title: string }) => {
    const existingTask = taskStore.tasks.find(t => t.id === task.id)
    if (existingTask) {
      activeTask.value = {
        id: task.id,
        title: task.title,
        duration: 25, // Default to 25 minutes
        notes: '',
        completed: existingTask.completed
      }
    }
    router.push('/pomodoro')
  }

  const updateTaskNotes = (notes: string) => {
    if (activeTask.value) {
      activeTask.value.notes = notes
    }
  }

  const toggleTaskCompletion = () => {
    if (activeTask.value) {
      activeTask.value.completed = !activeTask.value.completed
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
  }

  const clearTimer = () => {
    activeTask.value = null
    taskNotes.value = ''
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