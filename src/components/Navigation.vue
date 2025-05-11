<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
</script>

<template>
  <nav class="neumorphic fixed left-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl flex flex-col gap-6">
    <router-link 
      to="/" 
      class="p-3 rounded-xl transition-all duration-300"
      :class="route.path === '/' ? 'glass text-brand-orange' : 'hover:glass'"
    >
      📚
    </router-link>
    <router-link 
      to="/tasks" 
      class="p-3 rounded-xl transition-all duration-300"
      :class="route.path === '/tasks' ? 'glass text-brand-orange' : 'hover:glass'"
    >
      ✅
    </router-link>
    <router-link 
      to="/schedule" 
      class="p-3 rounded-xl transition-all duration-300"
      :class="route.path === '/schedule' ? 'glass text-brand-orange' : 'hover:glass'"
    >
      📅
    </router-link>
    <router-link 
      to="/pomodoro" 
      class="p-3 rounded-xl transition-all duration-300"
      :class="route.path === '/pomodoro' ? 'glass text-brand-orange' : 'hover:glass'"
    >
      ⏰
    </router-link>
    <router-link 
      to="/profile" 
      class="p-3 rounded-xl transition-all duration-300"
      :class="route.path === '/profile' ? 'glass text-brand-orange' : 'hover:glass'"
    >
      👤
    </router-link>
  </nav>
</template>