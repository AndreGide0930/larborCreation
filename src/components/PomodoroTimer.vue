<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import { useTimerStore } from '../stores/timer'

const props = defineProps<{
  onExit?: () => void
}>()

const emit = defineEmits<{
  (e: 'earlyComplete'): void
}>()

const timerStore = useTimerStore()

const isRunning = ref(false)
const minutes = ref(25)
const seconds = ref(0)
let timerInterval: number | undefined

onMounted(() => {
  if (timerStore.activeTask) {
    minutes.value = timerStore.activeTask.duration
  }
})

// Start or pause timer
const toggleTimer = () => {
  isRunning.value = !isRunning.value
  
  if (isRunning.value) {
    startTimer()
  } else {
    pauseTimer()
  }
}

// Start the timer
const startTimer = () => {
  timerInterval = setInterval(() => {
    if (seconds.value > 0) {
      seconds.value--
    } else if (minutes.value > 0) {
      minutes.value--
      seconds.value = 59
    } else {
      // Timer completed
      pauseTimer()
      isRunning.value = false
      // Optional: Play sound or show notification
    }
  }, 1000)
}

// Pause the timer
const pauseTimer = () => {
  clearInterval(timerInterval)
}

// Reset the timer
const resetTimer = () => {
  pauseTimer()
  isRunning.value = false
  if (timerStore.activeTask) {
    minutes.value = timerStore.activeTask.duration
  } else {
    minutes.value = 25
  }
  seconds.value = 0
}

const completeEarly = () => {
  pauseTimer()
  isRunning.value = false
  emit('earlyComplete')
}

const exitTimer = () => {
  pauseTimer()
  if (props.onExit) {
    props.onExit()
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  pauseTimer()
})
</script>

<template>
  <div class="neumorphic p-8 rounded-lg text-center max-w-xl w-full">
    <h2 class="text-2xl mb-6">Pomodoro Timer</h2>

    <div class="text-6xl font-montserrat mb-8">
      {{ minutes.toString().padStart(2, '0') }}:{{ seconds.toString().padStart(2, '0') }}
    </div>

    <div class="flex flex-wrap gap-4 justify-center">
      <button 
        class="glass px-6 py-3 rounded-lg text-xl hover:bg-brand-orange/10 transition-colors"
        @click="toggleTimer"
      >
        {{ isRunning ? 'Pause' : 'Start' }}
      </button>

      <button 
        class="glass px-6 py-3 rounded-lg text-xl hover:bg-brand-orange/10 transition-colors"
        @click="resetTimer"
      >
        Reset
      </button>

      <button 
        class="glass px-6 py-3 rounded-lg text-xl hover:bg-brand-orange/10 transition-colors text-green-500"
        @click="completeEarly"
      >
        Complete Early
      </button>

      <button 
        class="glass px-6 py-3 rounded-lg text-xl hover:bg-brand-orange/10 transition-colors"
        @click="exitTimer"
      >
        Exit
      </button>
    </div>
  </div>
</template>