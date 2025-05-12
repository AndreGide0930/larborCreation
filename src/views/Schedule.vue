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

interface TimeBlock {
  id: number
  startTime: string
  endTime: string
  tasks: Task[]
}

interface Task {
  id: number
  title: string
  urgent: boolean
  important: boolean
  dueDate: string
  completed: boolean
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  extendedProps: {
    taskId?: number
    urgent?: boolean
    important?: boolean
  }
}

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const calendarRef = ref()
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const showTaskSelector = ref(false)
const selectedTimeSlot = ref<{ start: string; end: string } | null>(null)
const showTimeGrid = ref(true)
const isCreatingPlan = ref(false)
const error = ref('')

const calendarOptions = {
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
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  nowIndicator: true,
  slotEventOverlap: false,
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false,
    hour12: false
  },
  locale: 'zh-cn',
  datesSet: handleDatesSet
}

function handleDatesSet(arg: any) {
  const currentDate = dayjs(arg.start).format('YYYY-MM-DD')
  if (currentDate !== selectedDate.value) {
    selectedDate.value = currentDate
    showTimeGrid.value = false
  }
}

async function createPlan() {
  if (isCreatingPlan.value) return

  try {
    isCreatingPlan.value = true
    error.value = ''

    await request('/api/createPlan', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate.value
      })
    })

    showTimeGrid.value = true
  } catch (e: any) {
    error.value = e.message || '创建计划失败，请稍后重试'
    setTimeout(() => {
      error.value = ''
    }, 3000)
  } finally {
    isCreatingPlan.value = false
  }
}

const events = computed(() => {
  return taskStore.getAllTasks.map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    start: `${task.dueDate}T09:00:00`,
    end: `${task.dueDate}T10:00:00`,
    backgroundColor: getEventColor(task),
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: {
      taskId: task.id,
      urgent: task.urgent,
      important: task.important
    }
  }))
})

function getEventColor(task: Task): string {
  if (task.urgent && task.important) return 'rgba(255, 107, 107, 0.9)'
  if (task.important) return 'rgba(77, 182, 172, 0.9)'
  if (task.urgent) return 'rgba(255, 183, 77, 0.9)'
  return 'rgba(144, 164, 174, 0.9)'
}

function handleDateSelect(selectInfo: any) {
  selectedTimeSlot.value = {
    start: selectInfo.startStr,
    end: selectInfo.endStr
  }
  showTaskSelector.value = true
}

function handleEventClick(clickInfo: any) {
  const taskId = clickInfo.event.extendedProps.taskId
  if (taskId) {
    const task = taskStore.tasks.find(t => t.id === taskId)
    if (task) {
      timerStore.startTimer({
        id: task.id,
        title: task.title
      })
    }
  }
}

function handleEventDrop(dropInfo: any) {
  const taskId = dropInfo.event.extendedProps.taskId
  if (taskId) {
    const newDate = dayjs(dropInfo.event.start).format('YYYY-MM-DD')
    taskStore.updateTask(taskId, { dueDate: newDate })
  }
}

function handleEventResize(resizeInfo: any) {
  console.log('Event resized', resizeInfo)
}

const availableTasks = computed(() => {
  return taskStore.getAllTasks.filter(task => !task.completed)
})

function assignTask(task: Task) {
  if (selectedTimeSlot.value) {
    const startTime = dayjs(selectedTimeSlot.value.start)
    taskStore.updateTask(task.id, {
      dueDate: startTime.format('YYYY-MM-DD')
    })
    showTaskSelector.value = false
    selectedTimeSlot.value = null
  }
}

const getTaskClass = (task: Task) => {
  const baseClasses = 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg'
  if (task.urgent && task.important) return `${baseClasses} from-brand-orange/20 to-transparent`
  if (task.important) return `${baseClasses} from-brand-mint/20 to-transparent`
  if (task.urgent) return `${baseClasses} from-yellow-500/20 to-transparent`
  return `${baseClasses} from-gray-500/20 to-transparent`
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-8">
      <!-- Header Section -->
      <div class="text-center">
        <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent font-montserrat">
          日程安排
        </h1>
        <p class="text-brand-blue/60 dark:text-white/60 font-opensans">
          高效规划和组织你的任务
        </p>
      </div>

      <!-- Calendar Section -->
      <div class="neumorphic p-8 rounded-3xl bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl">
        <FullCalendar 
          ref="calendarRef"
          :options="calendarOptions"
          :events="events"
          class="fc-theme-standard calendar-container"
        >
          <template #timeGridDay-body>
            <div v-if="!showTimeGrid" class="flex items-center justify-center h-[600px]">
              <div class="text-center">
                <button 
                  @click="createPlan"
                  :disabled="isCreatingPlan"
                  class="glass px-8 py-4 rounded-xl text-xl hover:bg-brand-orange/10 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span v-if="isCreatingPlan">创建中...</span>
                  <span v-else>开启计划</span>
                </button>
                <p v-if="error" class="mt-4 text-red-500">{{ error }}</p>
              </div>
            </div>
          </template>
        </FullCalendar>
      </div>
    </div>

    <!-- Task Selector Modal -->
    <div 
      v-if="showTaskSelector"
      class="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center backdrop-blur-xl transition-all duration-300"
      @click.self="showTaskSelector = false"
    >
      <div class="neumorphic p-8 rounded-3xl w-full max-w-md bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        <h2 class="text-2xl font-bold mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">安排任务</h2>
        <p class="text-sm mb-6 text-brand-blue/60 dark:text-white/60 font-opensans">
          {{ dayjs(selectedTimeSlot?.start).format('YYYY年MM月DD日 HH:mm') }}
        </p>
        
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            v-for="task in availableTasks"
            :key="task.id"
            class="neumorphic p-4 rounded-2xl cursor-pointer bg-gradient-to-r"
            :class="getTaskClass(task)"
            @click="assignTask(task)"
          >
            <div class="font-semibold">{{ task.title }}</div>
            <div class="flex gap-2 mt-2">
              <span 
                v-if="task.urgent" 
                class="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-brand-orange/20 to-transparent backdrop-blur-sm"
              >
                紧急
              </span>
              <span 
                v-if="task.important" 
                class="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-brand-mint/20 to-transparent backdrop-blur-sm"
              >
                重要
              </span>
              <span class="text-xs px-3 py-1 rounded-full bg-brand-blue/10 dark:bg-white/10 backdrop-blur-sm">
                截止: {{ dayjs(task.dueDate).format('MM/DD') }}
              </span>
            </div>
          </div>

          <div v-if="availableTasks.length === 0" class="text-center py-8 text-brand-blue/60 dark:text-white/60">
            暂无可安排的任务
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button 
            @click="showTaskSelector = false"
            class="w-full bg-gradient-to-r from-brand-orange to-brand-mint text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] font-semibold shadow-lg hover:shadow-xl"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.fc {
  @apply font-opensans;
}

.fc .fc-toolbar {
  @apply gap-4 flex-wrap mb-6;
}

.fc .fc-toolbar-title {
  @apply text-2xl font-montserrat bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent;
}

.fc .fc-button {
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg px-6 py-3 rounded-2xl border-none shadow-none hover:bg-brand-orange/10 transition-all duration-300 transform hover:scale-[1.02] !important;
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  @apply bg-brand-orange/20 transform scale-[0.98] !important;
}

.fc .fc-timegrid-slot {
  @apply h-16 transition-colors duration-300;
}

.fc .fc-timegrid-slot-lane {
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg rounded-xl;
}

.fc .fc-timegrid-now-indicator-line {
  @apply border-brand-orange border-2;
}

.fc .fc-timegrid-now-indicator-arrow {
  @apply border-brand-orange;
}

.fc .fc-event {
  @apply rounded-2xl border-none cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl backdrop-blur-sm;
}

.fc .fc-event-time {
  @apply font-semibold px-3 pt-2;
}

.fc .fc-event-title {
  @apply font-medium px-3 pb-2;
}

.fc .fc-timegrid-event {
  @apply bg-opacity-90 backdrop-blur-sm;
}

.fc .fc-timegrid-col-frame {
  @apply bg-white/30 dark:bg-brand-blue/30 rounded-2xl overflow-hidden;
}

.calendar-container {
  @apply rounded-2xl overflow-hidden shadow-xl;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.brand.orange') transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  @apply w-2;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-brand-orange/50 rounded-full hover:bg-brand-orange/70 transition-colors;
}

/* Additional modern styling */
.fc td, .fc th {
  @apply border-brand-orange/10 dark:border-white/10;
}

.fc-theme-standard td, .fc-theme-standard th {
  @apply border-brand-orange/10 dark:border-white/10;
}

.fc-timegrid-col-events {
  @apply px-1;
}

.fc-timegrid-event-harness {
  @apply px-1;
}

.fc-timegrid-cols {
  @apply rounded-2xl overflow-hidden;
}

.fc-scroller {
  @apply !overflow-y-auto custom-scrollbar;
}

.fc-scroller-liquid-absolute {
  @apply !overflow-y-auto custom-scrollbar;
}
</style>