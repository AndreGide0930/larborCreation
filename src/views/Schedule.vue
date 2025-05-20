<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTimerStore } from '../stores/timer'
import { useI18n } from 'vue-i18n'
import TimeGrid from '../components/TimeGrid.vue'
import ScheduleReminder from '../components/ScheduleReminder.vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { request } from '../utils/request'

// Enable UTC plugin
dayjs.extend(utc)

const { t } = useI18n()

interface Plan {
  pkPlan: number
  planDate: string
  planName: string
  fkUserInfo: {
    pkUserInfo: number
  }
  timedoroes: Timedoro[]
}

interface Task {
  pkCreation: number
  cName: string
  cType: string
  cPriority: number
  cSynopsis?: string
  cWeight: number
  cUrl?: string
  createTime: string
  updateTime?: string
}

interface Timedoro {
  pkTimedoro: number
  timeSlice: string
  creations: Task[]
  plans: Plan[]
  sumDone: number
  sumTodo: number
  fkUserInfo: number
}

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const currentPlan = ref<Plan | null>(null)
const showTaskModal = ref(false)
const showTimedoroModal = ref(false)
const selectedTimeSlot = ref<string | null>(null)
const selectedTimedoro = ref<Timedoro | null>(null)
const loading = ref(false)
const error = ref('')
const showDatePicker = ref(false)
const availableTasks = ref<Task[]>([])
const selectedTasks = ref<number[]>([])
const showAddTaskModal = ref(false)
const availableTasksForEdit = ref<Task[]>([])
const selectedTasksForEdit = ref<number[]>([])

// Add user info
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const isPastDate = computed(() => {
  const today = dayjs().startOf('day')
  return dayjs(selectedDate.value).isBefore(today)
})

const isFutureDate = computed(() => {
  const today = dayjs().startOf('day')
  return dayjs(selectedDate.value).isAfter(today)
})

// 新增日期选择处理函数
const handleDateSelect = async (date: string) => {
  selectedDate.value = date
  await loadPlanForDate(date)
}

// 新增返回今天按钮处理函数
const goToToday = async () => {
  const today = dayjs().format('YYYY-MM-DD')
  selectedDate.value = today
  await loadPlanForDate(today)
}

// 新增删除计划功能
const deletePlan = async () => {
  if (!currentPlan.value?.pkPlan) return

  try {
    loading.value = true
    error.value = ''

    await request('/api/deletePlan', {
      method: 'DELETE',
      params: {
        pkPlan: currentPlan.value.pkPlan
      }
    })

    currentPlan.value = null
  } catch (e: any) {
    error.value = e.message || '删除计划失败'
  } finally {
    loading.value = false
  }
}

async function loadPlanForDate(date: string) {
  try {
    loading.value = true
    error.value = ''
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

    const plan = await request('/api/readPlanByDateAndId', {
      params: {
        planDate: date,
        pkUserInfo: userInfo.pkUserInfo
      }
    }).catch(() => null)

    if (plan) {
      currentPlan.value = plan
      error.value = ''
    } else {
      currentPlan.value = null
      if (isPastDate.value) {
        error.value = `${dayjs(date).format('YYYY年MM月DD日')}没有计划记录`
      }
    }
  } catch (e: any) {
    console.error('加载计划失败:', e)
    error.value = e.message || '加载计划失败'
  } finally {
    loading.value = false
  }
}

async function createPlan() {
  try {
    loading.value = true
    error.value = ''
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    if (!userInfo.pkUserInfo) {
      throw new Error('用户信息不完整，请重新登录')
    }

    const planData = {
      planDate: selectedDate.value,
      planName: `${selectedDate.value} 的学习计划`,
      fkUserInfo: {
        pkUserInfo: userInfo.pkUserInfo
      }
    }

    const response = await request('/api/createPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planData)
    })

    if (!response) {
      throw new Error('创建计划失败：服务器未返回数据')
    }

    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    console.error('创建计划失败:', e)
    error.value = e.message || '创建计划失败'
  } finally {
    loading.value = false
  }
}

async function createTimedoro() {
  if (!selectedTimeSlot.value || !currentPlan.value || selectedTasks.value.length === 0) return

  try {
    loading.value = true
    error.value = ''

    // Get selected tasks info
    const selectedTasksInfo = await Promise.all(
      selectedTasks.value.map(async (taskId) => {
        const response = await request('/api/readOneWork', {
          params: {
            pkCreation: taskId
          }
        })
        return response
      })
    )

    // Calculate stats
    const stats = calculateStats(selectedTasksInfo)

    const timedoroData = {
      timeSlice: selectedTimeSlot.value,
      plans: [{
        pkPlan: currentPlan.value.pkPlan
      }],
      creations: selectedTasks.value.map(taskId => ({
        pkCreation: taskId
      })),
      sumDone: stats.sumDone,
      sumTodo: stats.sumTodo
    }

    await request('/api/createTimedoro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timedoroData)
    })

    await loadPlanForDate(selectedDate.value)
    showTaskModal.value = false
    selectedTasks.value = []
  } catch (e: any) {
    error.value = e.message || '创建专注时间失败'
  } finally {
    loading.value = false
  }
}

async function updateTimedoro() {
  if (!selectedTimedoro.value) return

  try {
    loading.value = true
    error.value = ''

    await request('/api/updateTimedoro', {
      method: 'PUT',
      body: JSON.stringify(selectedTimedoro.value)
    })

    await loadPlanForDate(selectedDate.value)
    showTimedoroModal.value = false
  } catch (e: any) {
    error.value = e.message || '更新专注时间失败'
  } finally {
    loading.value = false
  }
}

async function deleteTimedoro(pkTimedoro: number) {
  try {
    loading.value = true
    error.value = ''

    await request('/api/deleteTimedoro', {
      method: 'DELETE',
      params: {
        pkTimedoro
      }
    })

    await loadPlanForDate(selectedDate.value)
    showTimedoroModal.value = false
  } catch (e: any) {
    error.value = e.message || '删除专注时间失败'
  } finally {
    loading.value = false
  }
}

async function removeTaskFromTimedoro(pkCreation: number, pkTimedoro: number) {
  try {
    loading.value = true
    error.value = ''

    await request(`/api/works/${pkCreation}/timedoro/${pkTimedoro}`, {
      method: 'DELETE'
    })

    // Update current timedoro's creations list
    if (selectedTimedoro.value) {
      const updatedCreations = selectedTimedoro.value.creations.filter(task => task.pkCreation !== pkCreation)
      const stats = calculateStats(updatedCreations)
      
      selectedTimedoro.value = {
        ...selectedTimedoro.value,
        creations: updatedCreations,
        sumDone: stats.sumDone,
        sumTodo: stats.sumTodo
      }
    }

    // Reload plan data to update view
    await loadPlanForDate(selectedDate.value)

    // If modal is open, reload available tasks list
    if (showAddTaskModal.value) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const tasks = await request('/api/readAllWorkById', {
        params: {
          pkUserInfo: userInfo.pkUserInfo
        }
      })
      
      // Update available tasks list, filtering out tasks already in timedoro
      availableTasksForEdit.value = tasks.filter((task: Task) => 
        task.cType === 'TODO' && 
        !selectedTimedoro.value?.creations.some(creation => creation.pkCreation === task.pkCreation)
      )
    }
  } catch (e: any) {
    error.value = e.message || '移除任务失败'
  } finally {
    loading.value = false
  }
}

const handleAddTask = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const tasks = await request('/api/readAllWorkById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    
    // Filter out tasks not in current timedoro
    availableTasksForEdit.value = tasks.filter((task: Task) => 
      task.cType === 'TODO' && 
      !selectedTimedoro.value?.creations.some(creation => creation.pkCreation === task.pkCreation)
    )
    selectedTasksForEdit.value = []
    showAddTaskModal.value = true
  } catch (e: any) {
    error.value = e.message || '加载任务失败'
  }
}

const handleAddTasksToTimedoro = async () => {
  if (!selectedTimedoro.value || selectedTasksForEdit.value.length === 0) return

  try {
    loading.value = true
    error.value = ''

    // Get selected tasks info
    const selectedTasks = await Promise.all(
      selectedTasksForEdit.value.map(async (taskId) => {
        const response = await request('/api/readOneWork', {
          params: {
            pkCreation: taskId
          }
        })
        return response
      })
    )

    // Create new creations array
    const updatedCreations = [
      ...selectedTimedoro.value.creations,
      ...selectedTasks
    ]

    // Calculate new stats
    const stats = calculateStats(updatedCreations)

    // Update timedoro
    const apiTimedoro = {
      pkTimedoro: selectedTimedoro.value.pkTimedoro,
      timeSlice: selectedTimedoro.value.timeSlice,
      creations: updatedCreations.map(task => ({ pkCreation: task.pkCreation })),
      sumDone: stats.sumDone,
      sumTodo: stats.sumTodo,
      fkUserInfo: selectedTimedoro.value.fkUserInfo
    }

    await request('/api/updateTimedoro', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiTimedoro)
    })

    // Update local state
    selectedTimedoro.value = {
      ...selectedTimedoro.value,
      creations: updatedCreations,
      sumDone: stats.sumDone,
      sumTodo: stats.sumTodo
    }

    // Reload plan data to update view
    await loadPlanForDate(selectedDate.value)

    // Clear selected tasks
    selectedTasksForEdit.value = []
    showAddTaskModal.value = false
  } catch (e: any) {
    error.value = e.message || '更新专注时间失败'
  } finally {
    loading.value = false
  }
}

const startFocus = () => {
  if (!selectedTimedoro.value || selectedTimedoro.value.creations.length === 0) return

  // Get incomplete tasks
  const todoTasks = selectedTimedoro.value.creations.filter(task => task.cType === 'TODO')
  if (todoTasks.length === 0) {
    error.value = '没有待办任务可以专注'
    return
  }

  // Pass all todo tasks to pomodoro timer
  const tasks = todoTasks.map(task => ({
    id: task.pkCreation,
    title: task.cName,
    description: task.cSynopsis || '',
    priority: task.cPriority,
    type: task.cType
  }))

  timerStore.startTimer(tasks)
  showTimedoroModal.value = false
}

const updateTaskStatus = async (task: Task, timedoro: Timedoro) => {
  try {
    loading.value = true
    error.value = ''

    // Get latest task info
    const updatedTask = await request('/api/readOneWork', {
      params: {
        pkCreation: task.pkCreation
      }
    })

    // Update local timedoro task status
    const taskIndex = timedoro.creations.findIndex(t => t.pkCreation === task.pkCreation)
    if (taskIndex !== -1) {
      timedoro.creations[taskIndex] = updatedTask
    }

    // Recalculate stats
    const stats = calculateStats(timedoro.creations)
    
    // Update timedoro stats
    const updatedTimedoro = {
      ...timedoro,
      sumDone: stats.sumDone,
      sumTodo: stats.sumTodo
    }

    // Call API to update timedoro
    await request('/api/updateTimedoro', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTimedoro)
    })

    // Update local state
    if (selectedTimedoro.value && selectedTimedoro.value.pkTimedoro === timedoro.pkTimedoro) {
      selectedTimedoro.value = updatedTimedoro
    }

    // Reload plan data to update view
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '更新任务状态失败'
  } finally {
    loading.value = false
  }
}

const calculateStats = (creations: Task[]) => {
  return {
    sumDone: creations.filter(task => task.cType === 'DONE').length,
    sumTodo: creations.filter(task => task.cType === 'TODO').length
  }
}

const handleTimeBlockClick = async (time: string) => {
  if (!currentPlan.value) {
    error.value = '请先创建今日计划'
    return
  }

  // Convert time string to complete datetime
  const timeStr = time.split(':')
  const hours = parseInt(timeStr[0])
  const minutes = parseInt(timeStr[1])
  
  // Use local time to create datetime object
  const selectedDateTime = dayjs(selectedDate.value)
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0)
  
  // Convert to UTC time
  selectedTimeSlot.value = selectedDateTime.utc().format()
  
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const tasks = await request('/api/readAllWorkById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    
    availableTasks.value = tasks.filter((task: Task) => task.cType === 'TODO')
    selectedTasks.value = []
    showTaskModal.value = true
  } catch (e: any) {
    error.value = e.message || '加载任务失败'
  }
}

const handleTimeBlockEdit = async (timedoro: Timedoro) => {
  try {
    loading.value = true
    error.value = ''
    
    // Get latest timedoro data
    const updatedTimedoro = await request('/api/readTimedoro', {
      params: {
        pkTimedoro: timedoro.pkTimedoro
      }
    })
    
    if (updatedTimedoro) {
      const stats = calculateStats(updatedTimedoro.creations)
      
      selectedTimedoro.value = {
        ...updatedTimedoro,
        sumDone: stats.sumDone,
        sumTodo: stats.sumTodo
      }
      
      showTimedoroModal.value = true
    } else {
      throw new Error('获取时间块数据失败')
    }
  } catch (e: any) {
    error.value = e.message || '获取时间块数据失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadPlanForDate(selectedDate.value)
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-8">
      <div class="text-center">
        <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
          学习计划
        </h1>
        <p class="text-brand-blue/60 dark:text-white/60">
          高效规划你的学习时间
        </p>
      </div>

      <div class="neumorphic p-4 rounded-xl flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button 
            @click="handleDateSelect(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))"
            class="glass p-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            title="前一天"
          >
            <span class="text-xl">←</span>
          </button>
          
          <button 
            @click="goToToday"
            class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            :class="{ 'bg-brand-orange/10': dayjs(selectedDate).isSame(dayjs(), 'day') }"
          >
            今天
          </button>

          <button 
            @click="handleDateSelect(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))"
            class="glass p-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            title="后一天"
          >
            <span class="text-xl">→</span>
          </button>
        </div>

        <button 
          v-if="currentPlan"
          @click="deletePlan"
          :disabled="loading"
          class="glass px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-300"
        >
          {{ loading ? '删除中...' : '删除计划' }}
        </button>
      </div>

      <ScheduleReminder 
        v-if="currentPlan && !isPastDate"
        :pk-user-info="userInfo.pkUserInfo"
        :plan-date="selectedDate"
      />

      <div class="neumorphic p-8 rounded-3xl">
        <div v-if="!currentPlan" class="text-center py-12">
          <div v-if="isPastDate" class="text-red-500 mb-4">
            {{ error || '该日期没有计划记录' }}
          </div>
          <button 
            v-else
            @click="createPlan"
            :disabled="loading || isPastDate"
            class="glass px-8 py-4 rounded-xl text-xl hover:bg-brand-orange/10 transition-all duration-300 transform hover:scale-105"
          >
            {{ loading ? '创建中...' : `开启${isFutureDate ? '未来' : '今日'}计划` }}
          </button>
          <p v-if="error && !isPastDate" class="mt-4 text-red-500">{{ error }}</p>
        </div>

        <div v-else>
          <TimeGrid
            :timedoroes="currentPlan.timedoroes"
            :onTimeBlockClick="handleTimeBlockClick"
            :onTimeBlockEdit="handleTimeBlockEdit"
          />
        </div>
      </div>

      <!-- Task Selection Modal -->
      <div 
        v-if="showTaskModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
        @click.self="showTaskModal = false"
      >
        <div class="neumorphic p-8 rounded-2xl w-full max-w-md mx-4">
          <h2 class="text-2xl font-bold mb-6">{{ t('schedule.timeBlock.createBlock') }}</h2>
          
          <div class="mb-4">
            <div class="glass p-3 rounded-xl mb-4">
              <h3 class="font-semibold mb-2">{{ t('schedule.timeBlock.time') }}</h3>
              <div class="text-center text-lg">
                {{ dayjs(selectedTimeSlot).format('HH:mm') }}
              </div>
            </div>

            <div v-if="availableTasks.length === 0" class="text-center text-gray-500 my-4">
              {{ t('schedule.timeBlock.noTasks') }}
            </div>

            <div class="max-h-[400px] overflow-y-auto space-y-2">
              <label 
                v-for="task in availableTasks" 
                :key="task.pkCreation"
                class="glass p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-brand-orange/5 transition-colors"
              >
                <input 
                  type="checkbox"
                  :value="task.pkCreation"
                  v-model="selectedTasks"
                  class="w-5 h-5 rounded-lg accent-brand-orange"
                >
                <div class="flex-1">
                  <div class="font-medium">{{ task.cName }}</div>
                  <div v-if="task.cSynopsis" class="text-sm opacity-75">{{ task.cSynopsis }}</div>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs px-2 py-1 rounded-full bg-brand-orange/10 text-brand-orange">
                      优先级: {{ task.cPriority }}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              @click="createTimedoro"
              :disabled="loading || selectedTasks.length === 0"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
            >
              {{ loading ? t('common.loading') : t('schedule.timeBlock.createBlock') }}
            </button>
            <button
              type="button"
              @click="showTaskModal = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Timedoro Edit Modal -->
      <div 
        v-if="showTimedoroModal && selectedTimedoro"
        class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
        @click.self="showTimedoroModal = false"
      >
        <div class="neumorphic p-8 rounded-2xl w-full max-w-md mx-4">
          <h2 class="text-2xl font-bold mb-6">{{ t('schedule.editTimeBlock') }}</h2>
          
          <div class="space-y-6">
            <div class="glass p-4 rounded-xl">
              <h3 class="font-semibold mb-2">{{ t('schedule.timeBlock.time') }}</h3>
              <div class="text-center text-xl">
                {{ dayjs(selectedTimedoro.timeSlice).format('HH:mm') }}
              </div>
            </div>

            <div class="glass p-4 rounded-xl">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold">{{ t('schedule.timeBlock.tasks') }}</h3>
                <button
                  @click="handleAddTask"
                  class="glass px-3 py-1 rounded-lg text-sm hover:bg-brand-orange/10 transition-colors"
                >
                  {{ t('schedule.timeBlock.addTasks') }}
                </button>
              </div>
              
              <div v-if="selectedTimedoro.creations.length === 0" class="text-center text-gray-500 my-4">
                {{ t('schedule.timeBlock.noTasks') }}
              </div>

              <div v-else class="space-y-2">
                <div 
                  v-for="task in selectedTimedoro.creations" 
                  :key="task.pkCreation"
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-brand-orange/5"
                >
                  <div class="flex items-center gap-2">
                    <span 
                      class="w-2 h-2 rounded-full"
                      :class="task.cType === 'DONE' ? 'bg-green-500' : 'bg-brand-orange'"
                    ></span>
                    <span>{{ task.cName }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="task.cType === 'TODO'"
                      @click="updateTaskStatus(task, selectedTimedoro)"
                      class="text-green-500 hover:bg-green-500/10 p-1 rounded"
                      :title="t('schedule.timeBlock.markDone')"
                    >
                      ✓
                    </button>
                    <button
                      @click="removeTaskFromTimedoro(task.pkCreation, selectedTimedoro.pkTimedoro)"
                      class="text-red-500 hover:bg-red-500/10 p-1 rounded"
                      :title="t('schedule.timeBlock.removeTasks')"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="glass p-4 rounded-xl">
              <h3 class="font-semibold mb-2">{{ t('schedule.timeBlock.stats') }}</h3>
              <div class="flex justify-around text-center">
                <div>
                  <div class="text-2xl font-bold text-green-500">{{ selectedTimedoro.sumDone }}</div>
                  <div class="text-sm opacity-75">{{ t('tasks.status.done') }}</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-brand-orange">{{ selectedTimedoro.sumTodo }}</div>
                  <div class="text-sm opacity-75">{{ t('tasks.status.todo') }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-4 mt-8">
            <button
              @click="startFocus"
              :disabled="loading || !selectedTimedoro.creations.some(task => task.cType === 'TODO')"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
            >
              {{ loading ? '加载中...' : '现在专注' }}
            </button>
            <button
              @click="deleteTimedoro(selectedTimedoro.pkTimedoro)"
              :disabled="loading"
              class="glass px-6 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Add Task Modal -->
      <div 
        v-if="showAddTaskModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
        @click.self="showAddTaskModal = false"
      >
        <div class="neumorphic p-8 rounded-2xl w-full max-w-md mx-4">
          <h2 class="text-2xl font-bold mb-6">添加任务</h2>
          
          <div class="mb-4">
            <div class="max-h-[400px] overflow-y-auto space-y-2">
              <label 
                v-for="task in availableTasksForEdit" 
                :key="task.pkCreation"
                class="glass p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-brand-orange/5 transition-colors"
              >
                <input 
                  type="checkbox"
                  :value="task.pkCreation"
                  v-model="selectedTasksForEdit"
                  class="w-5 h-5 rounded-lg accent-brand-orange"
                >
                <div class="flex-1">
                  <div class="font-medium">{{ task.cName }}</div>
                  <div v-if="task.cSynopsis" class="text-sm opacity-75">{{ task.cSynopsis }}</div>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs px-2 py-1 rounded-full bg-brand-orange/10 text-brand-orange">
                      优先级: {{ task.cPriority }}
                    </span>
                  </div>
                
                </div>
              </label>
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              @click="handleAddTasksToTimedoro"
              :disabled="loading || selectedTasksForEdit.length === 0"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
            >
              {{ loading ? '添加中...' : '添加任务' }}
            </button>
            <button
              type="button"
              @click="showAddTaskModal = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass {
  @apply bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm;
}

.neumorphic {
  @apply bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl shadow-lg;
}
</style>