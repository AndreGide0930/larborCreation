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
</script>

<template>
  <nav class="neumorphic fixed left-8 top-1/2 -translate-y-1/2 p-4 rounded-3xl flex flex-col gap-6 bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl">
    <router-link 
      to="/" 
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === '/' ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      📚
    </router-link>
    <router-link 
      to="/tasks" 
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === '/tasks' ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      ✅
    </router-link>
    <router-link 
      to="/schedule" 
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === '/schedule' ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      📅
    </router-link>
    <router-link 
      to="/pomodoro" 
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === '/pomodoro' ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      ⏰
    </router-link>
    <router-link 
      to="/profile" 
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
      :class="route.path === '/profile' ? 'glass text-brand-orange shadow-lg' : 'hover:glass'"
    >
      👤
    </router-link>

    <button 
      v-if="authStore.isAuthenticated"
      @click="handleLogout"
      class="p-3 rounded-xl transition-all duration-300 transform hover:scale-110 text-red-500 hover:bg-red-500/10"
      title="Logout"
    >
      🚪
    </button>
  </nav>
</template>