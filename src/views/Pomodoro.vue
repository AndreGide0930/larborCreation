<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTimerStore } from '../stores/timer'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import TaskPanel from '../components/TaskPanel.vue'

const router = useRouter()
const timerStore = useTimerStore()

const handleExit = () => {
  timerStore.saveAndClearTimer()
  router.back()
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl mb-8 text-center">Focus Mode</h1>
    
    <div class="flex flex-col gap-8 items-center">
      <PomodoroTimer :onExit="handleExit" />
      <TaskPanel />
    </div>
  </div>
</template>