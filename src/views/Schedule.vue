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
  id: number
  date: string
  tasks: PlanTask[]
}

interface PlanTask {
  id: number
  title: string
  startTime: string
  endTime: string
  reminder?: {
    time: string
    type: 'before' | 'fixed'
    minutes?: number
  }
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

// Task creation form
const newTask = ref({
  title: '',
  reminder: {
    enabled: false,
    type: 'before',
    minutes: 15
  }
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
  locale: 'zh-cn'
}))

const events = computed(() => {
  if (!currentPlan.value?.tasks) return []
  
  return currentPlan.value.tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.startTime,
    end: task.endTime,
    backgroundColor: task.reminder ? '#FF6B6B' : '#4DB6AC',
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: {
      reminder: task.reminder
    }
  }))
})

async function createPlan() {
  try {
    loading.value = true
    error.value = ''
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    if (!userInfo.pkUserInfo) {
      throw new Error('用户信息不完整，请重新登录')
    }

    console.log('Creating plan with data:', {
      date: selectedDate.value,
      fkUserInfoId: userInfo.pkUserInfo
    })

    const response = await request('/api/createPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planDate: selectedDate.value,
        planName: `${selectedDate.value} 的学习计划`,
        fkUserInfoId: userInfo.pkUserInfo
      })
    })

    console.log('Plan creation response:', response)
    
    if (!response) {
      throw new Error('创建计划失败：服务器未返回数据')
    }

    currentPlan.value = response
  } catch (e: any) {
    console.error('创建计划失败:', e)
    error.value = e.message || '创建计划失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
}

async function handleTimeSlotSelect(selectInfo: any) {
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
  try {
    await request('/api/updateWork', {
      method: 'POST',
      body: JSON.stringify({
        taskId: dropInfo.event.id,
        startTime: dropInfo.event.startStr,
        endTime: dropInfo.event.endStr
      })
    })
  } catch (e: any) {
    error.value = e.message || '更新任务失败'
    setTimeout(() => error.value = '', 3000)
  }
}

async function handleEventResize(resizeInfo: any) {
  try {
    await request('/api/updateWork', {
      method: 'POST',
      body: JSON.stringify({
        taskId: resizeInfo.event.id,
        startTime: resizeInfo.event.startStr,
        endTime: resizeInfo.event.endStr
      })
    })
  } catch (e: any) {
    error.value = e.message || '更新任务失败'
    setTimeout(() => error.value = '', 3000)
  }
}

async function createTask() {
  if (!selectedTimeSlot.value || !currentPlan.value) return

  try {
    loading.value = true
    error.value = ''

    const taskData = {
      planId: currentPlan.value.id,
      title: newTask.value.title,
      startTime: selectedTimeSlot.value.start,
      endTime: selectedTimeSlot.value.end,
      reminder: newTask.value.reminder.enabled ? {
        type: newTask.value.reminder.type,
        minutes: newTask.value.reminder.minutes
      } : undefined
    }

    await request('/api/createTimedoro', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })

    // Refresh plan data
    const response = await request(`/api/readAllWorkById?planId=${currentPlan.value.id}`)
    currentPlan.value = response

    // Reset form
    newTask.value = {
      title: '',
      reminder: {
        enabled: false,
        type: 'before',
        minutes: 15
      }
    }
    showTaskModal.value = false
  } catch (e: any) {
    error.value = e.message || '创建任务失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const response = await request(`/api/readAllWorkById`, {
      params: {
        pkUserInfo: userInfo.pkUserInfo,
        date: selectedDate.value
      }
    })
    currentPlan.value = response
  } catch (e: any) {
    error.value = e.message || '加载计划失败'
    setTimeout(() => error.value = '', 3000)
  } finally {
    loading.value = false
  }
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

      <div class="neumorphic p-8 rounded-3xl">
        <div v-if="!currentPlan" class="text-center py-12">
          <button 
            @click="createPlan"
            :disabled="loading"
            class="glass px-8 py-4 rounded-xl text-xl hover:bg-brand-orange/10 transition-all duration-300 transform hover:scale-105"
          >
            {{ loading ? '创建中...' : `开启今日计划 (${dayjs(selectedDate).format('MM月DD日')})` }}
          </button>
          <p v-if="error" class="mt-4 text-red-500">{{ error }}</p>
        </div>

        <FullCalendar
          v-else
          ref="calendarRef"
          :options="calendarOptions"
          :events="events"
          class="calendar-container"
        />
      </div>
    </div>

    <!-- Task Creation Modal -->
    <div 
      v-if="showTaskModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showTaskModal = false"
    >
      <div class="neumorphic p-8 rounded-2xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">创建学习任务</h2>
        
        <form @submit.prevent="createTask" class="space-y-6">
          <div>
            <label class="block mb-2">任务名称</label>
            <input 
              v-model="newTask.title"
              type="text"
              required
              class="glass w-full p-3 rounded-xl"
              placeholder="输入任务名称"
            >
          </div>

          <div>
            <label class="block mb-2">时间段</label>
            <div class="glass p-3 rounded-xl text-center">
              {{ dayjs(selectedTimeSlot?.start).format('HH:mm') }} - 
              {{ dayjs(selectedTimeSlot?.end).format('HH:mm') }}
            </div>
          </div>

          <div class="space-y-4">
            <label class="flex items-center gap-2">
              <input
                v-model="newTask.reminder.enabled"
                type="checkbox"
                class="w-5 h-5 rounded-lg accent-brand-orange"
              >
              <span>开启提醒</span>
            </label>

            <div v-if="newTask.reminder.enabled" class="pl-7 space-y-4">
              <div>
                <label class="block mb-2">提醒方式</label>
                <select
                  v-model="newTask.reminder.type"
                  class="glass w-full p-3 rounded-xl"
                >
                  <option value="before">提前提醒</option>
                  <option value="fixed">固定时间</option>
                </select>
              </div>

              <div v-if="newTask.reminder.type === 'before'">
                <label class="block mb-2">提前时间（分钟）</label>
                <input
                  v-model="newTask.reminder.minutes"
                  type="number"
                  min="1"
                  max="60"
                  class="glass w-full p-3 rounded-xl"
                >
              </div>
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
            >
              {{ loading ? '创建中...' : '创建任务' }}
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