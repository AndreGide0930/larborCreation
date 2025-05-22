<template>
  <div class="min-h-screen bg-brand-gray dark:bg-brand-blue">
    <AnnouncementBanner />
    <Navigation v-if="showNavAndChat" />
    <RouterView v-slot="{ Component }">
      <transition 
        name="fade" 
        mode="out-in"
        @before-leave="handleBeforeLeave"
        @after-enter="handleAfterEnter"
      >
        <keep-alive>
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </RouterView>
    <ChatWindow v-if="showNavAndChat" />
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { onMounted, computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import ChatWindow from './components/ChatWindow.vue'
import AnnouncementBanner from './components/AnnouncementBanner.vue'
import { useAuthStore } from './stores/auth'

const colorMode = useColorMode()
const route = useRoute()
const authStore = useAuthStore()

const showNavAndChat = computed(() => {
  return authStore.isAuthenticated && 
         !route.path.includes('/login') && 
         !route.path.includes('/register') &&
         !route.path.includes('/admin')
})

onMounted(() => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode.value = 'dark'
  }
})

const handleBeforeLeave = () => {
  // Previous scroll handling removed
}

const handleAfterEnter = () => {
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
}

// Add route change listener
watch(() => route.path, () => {
  window.scrollTo(0, 0)
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

html, body {
  overflow-y: auto !important;
  height: auto !important;
}
</style>