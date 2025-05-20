<template>
  <div class="schedule-reminder">
    <div class="mb-4">
      <input
        type="datetime-local"
        v-model="reminderTime"
        class="w-full p-2 border rounded"
      />
    </div>
    
    <button
      @click="setReminder"
      :disabled="isLoading"
      class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      {{ isLoading ? 'Setting reminder...' : 'Set Reminder' }}
    </button>

    <div v-if="reminderSet" class="mt-4 text-green-600">
      Reminder set successfully!
    </div>

    <div v-if="error" class="mt-4 text-red-600">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const reminderTime = ref('')
const isLoading = ref(false)
const reminderSet = ref(false)
const error = ref('')

const setReminder = async () => {
  if (!reminderTime.value) {
    error.value = 'Please select a date and time'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    
    // Here you would typically make an API call to set the reminder
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
    
    reminderSet.value = true
    setTimeout(() => {
      reminderSet.value = false
    }, 3000)
  } catch (e) {
    error.value = 'Failed to set reminder. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.schedule-reminder {
  padding: 1rem;
  max-width: 400px;
  margin: 0 auto;
}
</style>