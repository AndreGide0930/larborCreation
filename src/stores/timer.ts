import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from './tasks'
import { request } from '../utils/request'

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
  const savedTasks = localStorage.getItem('activeTasks')
  const activeTasks = ref<TimerTask[]>(savedTasks ? JSON.parse(savedTasks) : [])
  const taskNotes = ref('')

  const startTimer = (tasks: { 
    id: number, 
    title: string,
    description?: string,
    priority?: number,
    type?: string
  }[]) => {
    console.log('Timer store received tasks:', tasks)
    const newTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      type: task.type,
      duration: 25, // Default to 25 minutes
      notes: '',
      completed: false
    }))
    
    // Save to store and localStorage
    activeTasks.value = newTasks
    localStorage.setItem('activeTasks', JSON.stringify(newTasks))
    
    console.log('Active tasks set to:', activeTasks.value)
    router.push('/pomodoro')
  }

  const updateTaskNotes = (taskId: number, notes: string) => {
    const task = activeTasks.value.find(t => t.id === taskId)
    if (task) {
      task.notes = notes
      localStorage.setItem('activeTasks', JSON.stringify(activeTasks.value))
    }
  }

  const toggleTaskCompletion = async (taskId: number) => {
    const task = activeTasks.value.find(t => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      localStorage.setItem('activeTasks', JSON.stringify(activeTasks.value))
      
      // 调用 changeType 接口
      try {
        await request('/api/changeType', {
          method: 'POST',
          params: {
            pkCreation: taskId
          }
        })
        console.log(`Task ${taskId} type changed to ${task.completed ? 'DONE' : 'TODO'}`)
      } catch (error) {
        console.error('Failed to change task type:', error)
        // 如果接口调用失败，回滚状态
        task.completed = !task.completed
        localStorage.setItem('activeTasks', JSON.stringify(activeTasks.value))
      }
    }
  }

  const saveAndClearTimer = async () => {
    // 保存所有任务的完成状态
    for (const task of activeTasks.value) {
      if (task.completed) {
        try {
          await request('/api/changeType', {
            method: 'POST',
            params: {
              pkCreation: task.id
            }
          })
        } catch (error) {
          console.error(`Failed to save completion state for task ${task.id}:`, error)
        }
      }
    }
    
    activeTasks.value = []
    taskNotes.value = ''
    localStorage.removeItem('activeTasks')
  }

  const clearTimer = () => {
    activeTasks.value = []
    taskNotes.value = ''
    localStorage.removeItem('activeTasks')
  }

  return {
    activeTasks,
    taskNotes,
    startTimer,
    clearTimer,
    updateTaskNotes,
    toggleTaskCompletion,
    saveAndClearTimer
  }
})