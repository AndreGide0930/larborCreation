<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTimerStore } from '../stores/timer'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { request } from '../utils/request'

interface Plan {
  pkPlan: number
  planDate: string
  planName: string
  fkUserInfoId: number
  timedoroes: any[]
}

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const calendarRef = ref()
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const currentPlan = ref<Plan | null>(null)
const showTaskModal = ref(false)
const selectedTimeSlot = ref<{ start: string; end: string } | null>(null)
const loading = ref(false)
const error = ref('')
const showDatePicker = ref(false)

// Task creation form
const newTask = ref({
  title: '',
  reminder: {
    enabled: false,
    type: 'before',
    minutes: 15
  }
})

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
  slotMinTime: '06:00:00',
  slotMaxTime: '22:00:00',
  slotDuration: '00:30:00',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek'
  },
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
  initialDate: selectedDate.value, // Set initial date to selected date
  datesSet: async (dateInfo: any) => {
    const newDate = dayjs(dateInfo.start).format('YYYY-MM-DD')
    if (newDate !== selectedDate.value) {
      selectedDate.value = newDate
      await loadPlanForDate(newDate)
    }
  }
}))

const events = computed(() => {
  if (!currentPlan?.value?.timedoroes) return []
  
  return currentPlan.value.timedoroes.map(timedoro => ({
    id: timedoro.pkTimedoro,
    title: timedoro.title || '专注时间',
    start: timedoro.timeSlice,
    end: dayjs(timedoro.timeSlice).add(25, 'minutes').format(),
    backgroundColor: timedoro.sumDone > 0 ? '#4DB6AC' : '#FF6B6B',
    borderColor: 'transparent',
    textColor: '#ffffff'
  }))
})

async function loadPlanForDate(date: string) {
  try {
    loading.value = true
    error.value = ''

    // 使用 readPlanByDate 获取指定日期的计划
    const plan = await request('/api/readPlanByDate', {
      params: {
        planDate: date
      }
    }).catch(() => null) // Handle empty result set gracefully

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

    // 创建计划后重新加载计划数据
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    console.error('创建计划失败:', e)
    error.value = e.message || '创建计划失败'
  } finally {
    loading.value = false
  }
}

const handleDateSelect = async (date: string) => {
  selectedDate.value = date
  showDatePicker.value = false
  await loadPlanForDate(date)
  
  // Update calendar date
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.gotoDate(date)
  }
}

async function handleTimeSlotSelect(selectInfo: any) {
  if (!currentPlan.value) {
    error.value = '请先创建今日计划'
    return
  }
  
  selectedTimeSlot.value = {
    start: selectInfo.startStr,
    end: selectInfo.endStr
  }
  showTaskModal.value = true
}

async function handleEventClick(clickInfo: any) {
  const taskId = clickInfo.event.id
  if (taskId) {
    timerStore.startTimer({
      id: Number(taskId),
      title: clickInfo.event.title
    })
  }
}

async function handleEventDrop(dropInfo: any) {
  if (!currentPlan.value) return
  
  try {
    await request('/api/updateTimedoro', {
      method: 'PUT',
      body: JSON.stringify({
        pkTimedoro: dropInfo.event.id,
        timeSlice: dropInfo.event.startStr
      })
    })
    
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '更新任务失败'
    setTimeout(() => error.value = '', 3000)
  }
}

async function handleEventResize(resizeInfo: any) {
  if (!currentPlan.value) return
  
  try {
    await request('/api/updateTimedoro', {
      method: 'PUT',
      body: JSON.stringify({
        pkTimedoro: resizeInfo.event.id,
        timeSlice: resizeInfo.event.startStr
      })
    })
    
    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    error.value = e.message || '更新任务失败'
    setTimeout(() => error.value = '', 3000)
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

      <!-- Date Selection -->
      <div class="neumorphic p-4 rounded-xl flex justify-center items-center gap-4">
        <button 
          @click="handleDateSelect(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))"
          class="glass p-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
        >
          前一天
        </button>
        
        <div class="relative">
          <button 
            @click="showDatePicker = !showDatePicker"
            class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors min-w-[200px]"
          >
            {{ dayjs(selectedDate).format('YYYY年MM月DD日') }}
          </button>
          
          <input 
            v-if="showDatePicker"
            type="date"
            :value="selectedDate"
            @change="(e) => handleDateSelect((e.target as HTMLInputElement).value)"
            class="absolute top-full left-0 mt-2 glass p-2 rounded-lg w-full"
          >
        </div>

        <button 
          @click="handleDateSelect(dayjs().add(1, 'day').format('YYYY-MM-DD'))"
          class="glass p-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
        >
          后一天
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

    <!-- Task Creation Modal -->
    <div 
      v-if="showTaskModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showTaskModal = false"
    >
      <div class="neumorphic p-8 rounded-2xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">创建专注时间</h2>
        
        <form @submit.prevent="createTask" class="space-y-6">
          <div>
            <label class="block mb-2">时间段</label>
            <div class="glass p-3 rounded-xl text-center">
              {{ dayjs(selectedTimeSlot?.start).format('HH:mm') }} - 
              {{ dayjs(selectedTimeSlot?.end).format('HH:mm') }}
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
            >
              {{ loading ? '创建中...' : '开始专注' }}
            </button>
            <button
              type="button"
              @click="showTaskModal = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
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

:deep(.fc .fc-timegrid-event) {
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
```