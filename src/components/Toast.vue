<!-- Toast.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  position?: 'top' | 'bottom'
}>()

const emit = defineEmits(['close'])
const visible = ref(false)
let timer: NodeJS.Timeout | null = null

onMounted(() => {
  visible.value = true
  if (props.duration !== 0) {
    timer = setTimeout(() => {
      close()
    }, props.duration || 3000)
  }
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

const close = () => {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'fixed left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2',
        position === 'bottom' ? 'bottom-8' : 'top-8',
        {
          'bg-green-500 text-white': type === 'success',
          'bg-red-500 text-white': type === 'error',
          'bg-blue-500 text-white': type === 'info'
        }
      ]"
    >
      <span v-if="type === 'success'">✅</span>
      <span v-else-if="type === 'error'">❌</span>
      <span v-else>ℹ️</span>
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style> 