<template>
  <div class="schedule-container">
    <!-- Date Selection -->
    <div class="date-navigation flex items-center justify-between mb-4">
      <button class="btn" @click="navigateDate(-1)">Previous Day</button>
      <div class="date-picker">
        <input 
          type="date" 
          v-model="selectedDate"
          class="form-input px-4 py-2 rounded"
        >
      </div>
      <button class="btn" @click="navigateDate(1)">Next Day</button>
    </div>

    <!-- Schedule Reminder Component -->
    <ScheduleReminder 
      :selected-date="selectedDate"
      @update:reminders="loadSchedule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ScheduleReminder from '../components/ScheduleReminder.vue'

const selectedDate = ref(new Date().toISOString().split('T')[0])

const navigateDate = (days: number) => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + days)
  selectedDate.value = date.toISOString().split('T')[0]
}

const loadSchedule = () => {
  // Load schedule data for the selected date
  // This will be implemented based on your data fetching requirements
}

onMounted(() => {
  loadSchedule()
})
</script>

<style scoped>
.schedule-container {
  padding: 2rem;
}

.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors;
}
</style>