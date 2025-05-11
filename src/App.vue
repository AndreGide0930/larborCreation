<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import ChatWindow from './components/ChatWindow.vue'

const colorMode = useColorMode()
const route = useRoute()

onMounted(() => {
  // Initialize dark mode based on system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode.value = 'dark'
  }
})
</script>

<template>
  <div class="min-h-screen bg-brand-gray dark:bg-brand-blue">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
      <img 
        src="https://api.iconify.design/material-symbols:assistant-rounded.png?color=%23FF6B6B" 
        alt="Secretary Logo"
        class="w-8 h-8"
      />
      <h1 class="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        Secretary个人学习秘书
      </h1>
    </div>
    <Navigation />
    <RouterView v-slot="{ Component }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
    <ChatWindow />
  </div>
</template>