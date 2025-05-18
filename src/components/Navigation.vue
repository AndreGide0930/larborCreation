<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const navItems = [
  { path: '/', icon: '📚', title: '作品集' },
  { path: '/tasks', icon: '✅', title: '任务' },
  { path: '/schedule', icon: '📅', title: '日程' },
  { path: '/pomodoro', icon: '⏰', title: '专注' },
  { path: '/analysis', icon: '📊', title: '分析' },
  { path: '/profile', icon: '👤', title: '我的' }
]
</script>

<template>
  <nav class="neumorphic fixed left-8 top-1/2 -translate-y-1/2 p-4 rounded-3xl flex flex-col gap-6 bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl">
    <router-link 
      v-for="item in navItems"
      :key="item.path"
      :to="item.path" 
      :title="item.title"
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === item.path ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      {{ item.icon }}
    </router-link>

    <button 
      v-if="authStore.isAuthenticated"
      @click="handleLogout"
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110 text-red-500 hover:bg-red-500/10"
      title="退出登录"
    >
      🚪
    </button>
  </nav>
</template>