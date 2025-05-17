<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTimerStore } from '../stores/timer'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { request } from '../utils/request'

// Enable UTC and timezone plugins
dayjs.extend(utc)
dayjs.extend(timezone)

// Set default timezone to local
dayjs.tz.setDefault(dayjs.tz.guess())

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
const calendarRef = ref()
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const currentPlan = ref<Plan | null>(null)
const showTaskModal = ref(false)
const showTimedoroModal = ref(false)
const selectedTimeSlot = ref<{ start: string; end: string } | null>(null)
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

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  slotMinTime: '00:00:00',
  slotMaxTime: '23:59:59',
  slotDuration: '00:30:00',
  headerToolbar: false as const,
  buttonText: {
    today: '今天',
    day: '日',
    week: '周'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  allDaySlot: false,
  expandRows: true,
  select: handleTimeSlotSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  nowIndicator: true,
  slotEventOverlap: false,
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    meridiem: false,
    hour12: false
  },
  locale: 'zh-cn',
  initialDate: selectedDate.value,
  datesSet: async (dateInfo: any) => {
    const newDate = dayjs(dateInfo.start).format('YYYY-MM-DD')
    if (newDate !== selectedDate.value) {
      selectedDate.value = newDate
      await loadPlanForDate(newDate)
    }
  },
  eventContent: (arg: any) => {
    console.log('eventContent called with:', arg)
    const timedoro = arg.event.extendedProps.timedoro
    console.log('Timedoro in eventContent:', timedoro)
    
    if (!timedoro) {
      console.log('No timedoro found')
      return { html: '<div class="p-1">加载中...</div>' }
    }

    console.log('Timedoro creations:', timedoro.creations)
    
    return {
      html: `
        <div class="p-1 h-full">
          <div class="font-semibold">${arg.timeText}</div>
          <div class="text-sm">
            ${timedoro.creations?.map((task: Task) => `
              <div class="flex items-center gap-1 mt-1">
                <span class="w-2 h-2 rounded-full ${task.cType === 'DONE' ? 'bg-green-300' : 'bg-orange-300'}"></span>
                <span class="truncate">${task.cName || '未命名任务'}</span>
              </div>
            `).join('') || '暂无任务'}
          </div>
          <div class="text-xs mt-1">
            <span class="bg-white/20 px-1 rounded">完成: ${timedoro.sumDone}</span>
            <span class="bg-white/20 px-1 rounded ml-1">待办: ${timedoro.sumTodo}</span>
          </div>
        </div>
      `
    }
  }
}))

const events = computed(() => {
  if (!currentPlan?.value?.timedoroes) return []
  
  console.log('Processing timedoroes:', currentPlan.value.timedoroes)
  
  return currentPlan.value.timedoroes.map(timedoro => {
    // Parse the UTC time from the server
    const timeSlice = dayjs(timedoro.timeSlice)
    
    // Create start and end times in local timezone
    const start = timeSlice.local()
    const end = start.add(30, 'minutes')
    
    console.log('Timedoro processing:', {
      id: timedoro.pkTimedoro,
      timeSlice: timedoro.timeSlice,
      parsedTime: timeSlice.format(),
      localStart: start.format(),
      localEnd: end.format(),
      creations: timedoro.creations
    })
    
    return {
      id: timedoro.pkTimedoro,
      title: timedoro.creations?.map(c => c.cName || '未命名任务').join(', ') || '专注时间',
      start: start.format(),
      end: end.format(),
      backgroundColor: timedoro.sumDone > 0 ? '#4DB6AC' : '#FF6B6B',
      borderColor: 'transparent',
      textColor: '#ffffff',
      extendedProps: {
        timedoro
      }
    }
  })
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

    const selectedDateTime = dayjs(selectedTimeSlot.value.start)
    const timeSlice = selectedDateTime.format('YYYY-MM-DDTHH:mm:ss')

    const timedoroData = {
      timeSlice: timeSlice,
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
  
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.gotoDate(date)
  }
}

const goToToday = async () => {
  const today = dayjs().format('YYYY-MM-DD')
  await handleDateSelect(today)
}

async function handleTimeSlotSelect(selectInfo: any) {
  if (!currentPlan.value) {
    error.value = '请先创建今日计划'
    return
  }
  
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const tasks = await request('/api/readAllWorkById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    
    availableTasks.value = tasks.filter((task: Task) => task.cType === 'TODO')
    selectedTasks.value = []
    
    const selectedDateTime = dayjs(selectInfo.startStr)
    selectedTimeSlot.value = {
      start: selectedDateTime.format('YYYY-MM-DDTHH:mm:ss'),
      end: selectedDateTime.add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
    }
    
    showTaskModal.value = true
  } catch (e: any) {
    error.value = e.message || '加载任务失败'
  }
}

async function handleEventClick(clickInfo: any) {
  selectedTimedoro.value = clickInfo.event.extendedProps.timedoro
  showTimedoroModal.value = true
}

async function handleEventDrop(dropInfo: any) {
  if (!currentPlan.value) return
  
  try {
    const timedoro = dropInfo.event.extendedProps.timedoro
    timedoro.timeSlice = dropInfo.event.startStr
    
    await request('/api/updateTimedoro', {
      method: 'PUT',
      body: JSON.stringify(timedoro)
    })
    
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '更新时间失败'
    setTimeout(() => error.value = '', 3000)
  }
}

async function handleEventResize(resizeInfo: any) {
  if (!currentPlan.value) return
  
  try {
    const timedoro = resizeInfo.event.extendedProps.timedoro
    timedoro.timeSlice = resizeInfo.event.startStr
    
    await request('/api/updateTimedoro', {
      method: 'PUT',
      body: JSON.stringify(timedoro)
    })
    
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '更新时间失败'
    setTimeout(() => error.value = '', 3000)
  }
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

import { watch } from 'vue'
watch(events, val => {
  console.log('events:', val)
}, { immediate: true })
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
          <FullCalendar
            ref="calendarRef"
            :options="calendarOptions"
            :events="events"
            class="calendar-container"
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
            {{ dayjs(selectedTimeSlot?.start).format('HH:mm') }} - 
            {{ dayjs(selectedTimeSlot?.end).format('HH:mm') }}
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
.calendar-container {
  @apply rounded-2xl overflow-hidden;
}

:deep(.fc) {
  @apply font-opensans;
}

:deep(.fc .fc-toolbar) {
  @apply gap-4 flex-wrap mb-6;
}

:deep(.fc .fc-toolbar-title) {
  @apply text-2xl font-montserrat bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent;
}

:deep(.fc .fc-button) {
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg px-6 py-3 rounded-2xl border-none shadow-none hover:bg-brand-orange/10 transition-all duration-300 transform hover:scale-[1.02] !important;
}

:deep(.fc .fc-button-primary:not(:disabled).fc-button-active),
:deep(.fc .fc-button-primary:not(:disabled):active) {
  @apply bg-brand-orange/20 transform scale-[0.98] !important;
}

:deep(.fc .fc-timegrid-slot) {
  @apply h-16 transition-colors duration-300;
}

:deep(.fc .fc-timegrid-slot-lane) {
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg rounded-xl;
}

:deep(.fc .fc-timegrid-now-indicator-line) {
  @apply border-brand-orange border-2;
}

:deep(.fc .fc-timegrid-now-indicator-arrow) {
  @apply border-brand-orange;
}

:deep(.fc .fc-event) {
  @apply rounded-2xl border-none cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl backdrop-blur-sm;
}

:deep(.fc .fc-event-time) {
  @apply font-semibold px-3 pt-2;
}

:deep(.fc .fc-event-title) {
  @apply font-medium px-3 pb-2;
}

:deep(.fc .fc-timegrid-event)  {
  @apply bg-opacity-90 backdrop-blur-sm;
}

:deep(.fc .fc-timegrid-col-frame) {
  @apply bg-white/30 dark:bg-brand-blue/30 rounded-2xl overflow-hidden;
}

:deep(.fc td),
:deep(.fc th) {
  @apply border-brand-orange/10 dark:border-white/10;
}
</style>