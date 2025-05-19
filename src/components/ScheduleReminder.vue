<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { request } from '../utils/request'
import Toast from './Toast.vue'

const { t } = useI18n()

const props = defineProps<{
  pkUserInfo: number | string
  planDate: string
}>()

const loading = ref(false)
const reminderTime = ref('')
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.value = {
    show: true,
    message,
    type
  }
}

const scheduleReminder = async () => {
  if (!reminderTime.value) {
    showToast(t('schedule.reminder.timeRequired'), 'error')
    return
  }

  try {
    loading.value = true
    
    // 将选择的时间转换为时间戳（毫秒）
    const timestamp = new Date(reminderTime.value).getTime()
    
    const response = await request('/api/scheduleReminder', {
      method: 'POST',
      params: {
        pkUserInfo: props.pkUserInfo,
        planDate: props.planDate,
        remindTimestamp: timestamp
      }
    })

    if (response) {
      showToast(t('schedule.reminder.scheduleSuccess'), 'success')
      reminderTime.value = ''
    }
  } catch (error: any) {
    showToast(error.message || t('schedule.reminder.scheduleFailed'), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="neumorphic p-4 rounded-xl">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <div class="relative flex-1">
          <input
            type="datetime-local"
            v-model="reminderTime"
            class="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/50 pr-10"
            :min="new Date().toISOString().slice(0, 16)"
            :placeholder="t('schedule.reminder.selectTime')"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">⏰</span>
        </div>
        <button
          @click="scheduleReminder"
          :disabled="loading"
          class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-all duration-300 flex items-center gap-2 min-w-[120px] justify-center"
          :class="{'opacity-50': loading}"
        >
          <span v-if="loading" class="animate-spin">🔄</span>
          <span v-else>📅</span>
          {{ loading ? t('schedule.reminder.scheduling') : t('schedule.reminder.schedule') }}
        </button>
      </div>

      <Toast
        v-if="toast.show"
        :message="toast.message"
        :type="toast.type"
        @close="toast.show = false"
        position="bottom"
      />
    </div>
  </div>
</template>

<style scoped>
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  background: transparent;
  bottom: 0;
  color: transparent;
  cursor: pointer;
  height: auto;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
}

.glass {
  @apply bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm;
}

.neumorphic {
  @apply bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl shadow-lg;
}
</style> 