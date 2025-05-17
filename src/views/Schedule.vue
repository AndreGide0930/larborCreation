<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTimerStore } from '../stores/timer'
import TimeGrid from '../components/TimeGrid.vue'
import dayjs from 'dayjs'
import { request } from '../utils/request'

interface Plan {
  pkPlan: number
  planDate: string
  planName: string
  fkUserInfoId: number
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

const isPastDate = computed(() => {
  const today = dayjs().startOf('day')
  return dayjs(selectedDate.value).isBefore(today)
})

const isFutureDate = computed(() => {
  const today = dayjs().startOf('day')
  return dayjs(selectedDate.value).isAfter(today)
})

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
      fkUserInfoId: userInfo.pkUserInfo
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

    const timedoroData = {
      timeSlice: selectedTimeSlot.value,
      plans: [{
        pkPlan: currentPlan.value.pkPlan
      }],
      creations: selectedTasks.value.map(taskId => ({
        pkCreation: taskId
      }))
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

    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '移除任务失败'
  } finally {
    loading.value = false
  }
}

const handleDateSelect = async (date: string) => {
  selectedDate.value = date
  showDatePicker.value = false
  await loadPlanForDate(date)
}

const goToToday = async () => {
  const today = dayjs().format('YYYY-MM-DD')
  await handleDateSelect(today)
}

const handleTimeBlockClick = async (time: string) => {
  if (!currentPlan.value) {
    error.value = '请先创建今日计划'
    return
  }

  const timeStr = time.split(':')
  const hours = parseInt(timeStr[0])
  const minutes = parseInt(timeStr[1])
  const selectedDateTime = dayjs(selectedDate.value)
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0)
  
  selectedTimeSlot.value = selectedDateTime.format('YYYY-MM-DDTHH:mm:ss')
  
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

const handleTimeBlockEdit = (timedoro: Timedoro) => {
  selectedTimedoro.value = timedoro
  showTimedoroModal.value = true
}

async function deletePlan() {
  if (!currentPlan.value) return

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
    console.error('删除计划失败:', e)
    error.value = e.message || '删除计划失败'
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
          
          <div class="relative">
            <button 
              @click="showDatePicker = !showDatePicker"
              class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors min-w-[200px] text-lg font-semibold"
            >
              {{ dayjs(selectedDate).format('YYYY年MM月DD日') }}
            </button>
            
            <input 
              v-if="showDatePicker"
              type="date"
              :value="selectedDate"
              @change="(e) => handleDateSelect((e.target as HTMLInputElement).value)"
              class="absolute top-full left-0 mt-2 glass p-2 rounded-lg w-full z-10"
            >
          </div>

          <button 
            @click="handleDateSelect(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))"
            class="glass p-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            title="后一天"
          >
            <span class="text-xl">→</span>
          </button>

          <button 
            @click="goToToday"
            class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            :class="{ 'bg-brand-orange/10': dayjs(selectedDate).isSame(dayjs(), 'day') }"
          >
            今天
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
    </div>

    <!-- Task Selection Modal -->
    <div 
      v-if="showTaskModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showTaskModal = false"
    >
      <div class="neumorphic p-8 rounded-2xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">选择任务</h2>
        
        <div class="mb-4">
          <div class="glass p-3 rounded-xl text-center mb-4">
            {{ selectedTimeSlot ? dayjs(selectedTimeSlot).format('HH:mm') : '--:--' }} - 
            {{ selectedTimeSlot ? dayjs(selectedTimeSlot).add(30, 'minutes').format('HH:mm') : '--:--' }}
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
                <div class="font-medium">{{ task.cName || '未命名任务' }}</div>
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
            {{ loading ? '创建中...' : '创建时间块' }}
          </button>
          <button
            type="button"
            @click="showTaskModal = false"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- Timedoro Edit Modal -->
    <div 
      v-if="showTimedoroModal && selectedTimedoro"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showTimedoroModal = false"
    >
      <div class="neumorphic p-8 rounded-2xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">编辑时间块</h2>
        
        <div class="space-y-6">
          <div class="glass p-4 rounded-xl">
            <h3 class="font-semibold mb-2">时间</h3>
            <div class="text-center text-xl">
              {{ dayjs(selectedTimedoro.timeSlice).format('HH:mm') }} - 
              {{ dayjs(selectedTimedoro.timeSlice).add(30, 'minutes').format('HH:mm') }}
            </div>
          </div>

          <div class="glass p-4 rounded-xl">
            <h3 class="font-semibold mb-2">关联任务</h3>
            <div class="space-y-2">
              <div 
                v-for="task in selectedTimedoro.creations" 
                :key="task.pkCreation"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-brand-orange/5"
              >
                <div class="flex items-center gap-2">
                  <span 
                    class="w-2 h-2 rounded-full"
                    :class="task.cType === 'TODO' ? 'bg-green-500' : 'bg-brand-orange'"
                  ></span>
                  <span>{{ task.cName || '未命名任务' }}</span>
                </div>
                <button
                  @click="removeTaskFromTimedoro(task.pkCreation, selectedTimedoro.pkTimedoro)"
                  class="text-red-500 hover:bg-red-500/10 p-1 rounded"
                  title="移除任务"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div class="glass p-4 rounded-xl">
            <h3 class="font-semibold mb-2">统计</h3>
            <div class="flex justify-around text-center">
              <div>
                <div class="text-2xl font-bold text-green-500">{{ selectedTimedoro.sumDone }}</div>
                <div class="text-sm opacity-75">已完成</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-brand-orange">{{ selectedTimedoro.sumTodo }}</div>
                <div class="text-sm opacity-75">待完成</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button
            @click="updateTimedoro"
            :disabled="loading"
            class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
          >
            {{ loading ? '更新中...' : '更新时间块' }}
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
  </div>
</template>

<style scoped>
/* ... (样式保持不变) ... */
</style>