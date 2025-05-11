<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTimerStore } from '../stores/timer'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'

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
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  allDaySlot: false,
  expandRows: true,
  height: 'auto',
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize
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
  if (task.urgent && task.important) return '#FF6B6B'
  if (task.important) return '#4DB6AC'
  if (task.urgent) return '#FFB74D'
  return '#90A4AE'
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
  if (task.urgent && task.important) return 'bg-brand-orange/10'
  if (task.important) return 'bg-brand-mint/10'
  if (task.urgent) return 'bg-yellow-500/10'
  return 'bg-gray-500/10'
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-8">
      <!-- Header Section -->
      <div class="text-center">
        <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
          Schedule Planner
        </h1>
        <p class="text-brand-blue/60 dark:text-white/60">
          Plan and organize your tasks efficiently
        </p>
      </div>

      <!-- Calendar Section -->
      <div class="neumorphic p-6 rounded-2xl bg-white/80 dark:bg-brand-blue/80">
        <FullCalendar 
          ref="calendarRef"
          :options="calendarOptions"
          :events="events"
          class="fc-theme-standard calendar-container"
        />
      </div>
    </div>

    <!-- Task Selector Modal -->
    <div 
      v-if="showTaskSelector"
      class="fixed inset-0 bg-black/30 flex items-center justify-center backdrop-blur-md"
      @click.self="showTaskSelector = false"
    >
      <div class="neumorphic p-8 rounded-2xl w-full max-w-md bg-white/90 dark:bg-brand-blue/90">
        <h2 class="text-2xl font-bold mb-6 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
          Schedule Task
        </h2>
        <p class="text-sm mb-6 text-brand-blue/60 dark:text-white/60">
          {{ dayjs(selectedTimeSlot?.start).format('MMM D, YYYY h:mm A') }}
        </p>
        
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            v-for="task in availableTasks"
            :key="task.id"
            class="neumorphic p-4 rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            :class="getTaskClass(task)"
            @click="assignTask(task)"
          >
            <div class="font-semibold">{{ task.title }}</div>
            <div class="flex gap-2 mt-2">
              <span 
                v-if="task.urgent" 
                class="text-xs px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange"
              >
                Urgent
              </span>
              <span 
                v-if="task.important" 
                class="text-xs px-2 py-0.5 rounded-full bg-brand-mint/10 text-brand-mint"
              >
                Important
              </span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-brand-blue/10 dark:bg-white/10">
                Due: {{ task.dueDate }}
              </span>
            </div>
          </div>

          <div v-if="availableTasks.length === 0" class="text-center py-8 text-brand-blue/60 dark:text-white/60">
            No tasks available to schedule
          </div>
        </div>

        <button 
          @click="showTaskSelector = false"
          class="mt-6 w-full bg-gradient-to-r from-brand-orange to-brand-mint text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
        >
          Close
        </button>
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
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg px-4 py-2 rounded-xl border-none shadow-none hover:bg-brand-orange/10 transition-colors !important;
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  @apply bg-brand-orange/20 !important;
}

.fc .fc-timegrid-slot {
  @apply h-16;
}

.fc .fc-timegrid-slot-lane {
  @apply bg-white/30 dark:bg-brand-blue/30 backdrop-blur-lg;
}

.fc .fc-timegrid-now-indicator-line {
  @apply border-brand-orange;
}

.fc .fc-timegrid-now-indicator-arrow {
  @apply border-brand-orange;
}

.fc .fc-event {
  @apply rounded-xl border-none cursor-pointer transition-transform hover:scale-[1.02] shadow-lg;
}

.fc .fc-event-time {
  @apply font-semibold;
}

.fc .fc-event-title {
  @apply font-medium;
}

.fc .fc-timegrid-event {
  @apply bg-opacity-90 backdrop-blur-sm;
}

.fc .fc-timegrid-col-frame {
  @apply bg-white/30 dark:bg-brand-blue/30;
}

.calendar-container {
  @apply rounded-xl overflow-hidden shadow-xl;
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
</style>