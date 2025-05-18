<!-- FormError.vue -->
<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <Transition name="error">
    <p v-if="message" class="text-sm text-red-500 mt-1">
      {{ message }}
    </p>
  </Transition>
</template>

<style scoped>
.error-enter-active,
.error-leave-active {
  transition: all 0.2s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style> 