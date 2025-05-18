<!-- Modal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
}>()

const emit = defineEmits(['close'])
const modalVisible = ref(false)

watch(() => props.show, (newVal) => {
  modalVisible.value = newVal
})

const close = () => {
  modalVisible.value = false
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="close"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <span v-if="type === 'error'" class="text-2xl">⚠️</span>
            <span v-else-if="type === 'warning'" class="text-2xl">⚡</span>
            <span v-else class="text-2xl">ℹ️</span>
            <h3 class="text-xl font-semibold">{{ title }}</h3>
          </div>
          
          <p class="text-gray-600 dark:text-gray-300">{{ message }}</p>
          
          <div class="mt-6 flex justify-end">
            <button
              @click="close"
              class="px-4 py-2 bg-brand-orange text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style> 