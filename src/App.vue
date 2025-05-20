<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import ChatWindow from './components/ChatWindow.vue'
import { useAuthStore } from './stores/auth'

const colorMode = useColorMode()
const route = useRoute()
const authStore = useAuthStore()

const showNavAndChat = computed(() => {
  return authStore.isAuthenticated && 
         !route.path.includes('/login') && 
         !route.path.includes('/register')
})

onMounted(() => {
  // Initialize dark mode based on system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode.value = 'dark'
  }
})

const handleBeforeLeave = () => {
  if (document.body) {
    document.body.style.overflow = 'hidden'
  }
}

const handleAfterEnter = () => {
  if (document.body) {
    document.body.style.overflow = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-gray dark:bg-brand-blue">
    <Navigation v-if="showNavAndChat" />
    <RouterView v-slot="{ Component }">
      <transition 
        name="fade" 
        mode="out-in"
        @before-leave="handleBeforeLeave"
        @after-enter="handleAfterEnter"
      >
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </RouterView>
    <ChatWindow v-if="showNavAndChat" />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>