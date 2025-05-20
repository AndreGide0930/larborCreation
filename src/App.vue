<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { onMounted, computed, watch } from 'vue'
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
  // 移除之前的滚动条处理
  // if (document.body) {
  //   document.body.style.overflow = 'hidden'
  // }
}

const handleAfterEnter = () => {
  // 移除之前的滚动条处理
  // if (document.body) {
  //   document.body.style.overflow = ''
  // }
  // 确保页面可以滚动
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
}

// 添加路由变化监听
watch(() => route.path, () => {
  // 每次路由变化时重置滚动位置
  window.scrollTo(0, 0)
  // 确保页面可以滚动
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
})
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
        <keep-alive>
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </RouterView>
    <ChatWindow v-if="showNavAndChat" />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 确保页面内容可以正常滚动 */
html, body {
  overflow-y: auto !important;
  height: auto !important;
}
</style>