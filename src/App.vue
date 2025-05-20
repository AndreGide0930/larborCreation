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
</script>

<template>
  <div class="min-h-screen bg-brand-gray dark:bg-brand-blue">
    <Navigation v-if="showNavAndChat" />
    <RouterView v-slot="{ Component }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
    <ChatWindow v-if="showNavAndChat" />
  </div>
</template>