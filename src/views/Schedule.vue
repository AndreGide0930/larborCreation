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

onMounted(async () => {
  await loadPlanForDate(selectedDate.value)
})
</script>

<template>
  <div class="container mx-auto p-4 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold">{{ t('schedule.title') }}</h1>
        <div class="relative">
          <button
            @click="showDatePicker = !showDatePicker"
            class="glass px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>📅</span>
            {{ dayjs(selectedDate).format('YYYY年MM月DD日') }}
          </button>
          
          <input
            v-if="showDatePicker"
            type="date"
            v-model="selectedDate"
            class="absolute top-full left-0 mt-2 glass px-4 py-2 rounded-lg"
            @change="() => {
              showDatePicker = false
              loadPlanForDate(selectedDate)
            }"
          >
        </div>
      </div>

      <div class="flex items-center gap-4">
        <ScheduleReminder
          v-if="currentPlan"
          :pk-user-info="userInfo.pkUserInfo"
          :plan-date="selectedDate"
        />
        
        <button
          v-if="!currentPlan && !isPastDate"
          @click="createPlan"
          :disabled="loading"
          class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors flex items-center gap-2"
        >
          <span>📝</span>
          {{ t('schedule.createPlan') }}
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-8">
      <div class="text-center">
        <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
          学习计划
        </h1>
        <p class="text-brand-blue/60 dark:text-white/60">
          高效规划你的学习时间
        </p>
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
            :onTimeBlockClick="() => {}"
            :onTimeBlockEdit="() => {}"
          />
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