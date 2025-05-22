<template>
  <div class="min-h-screen bg-brand-gray dark:bg-brand-blue">
    <!-- Admin Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl shadow-lg z-40">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <router-link 
              to="/admin/dashboard"
              class="text-xl font-bold bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent"
            >
              管理控制台
            </router-link>
            
            <div class="flex gap-4">
              <router-link 
                to="/admin/dashboard"
                class="px-4 py-2 rounded-lg transition-colors"
                :class="$route.path === '/admin/dashboard' ? 'bg-brand-orange/10 text-brand-orange' : 'hover:bg-brand-orange/5'"
              >
                仪表盘
              </router-link>
              <router-link 
                to="/admin/users"
                class="px-4 py-2 rounded-lg transition-colors"
                :class="$route.path === '/admin/users' ? 'bg-brand-orange/10 text-brand-orange' : 'hover:bg-brand-orange/5'"
              >
                用户管理
              </router-link>
              <router-link 
                to="/admin/announcements"
                class="px-4 py-2 rounded-lg transition-colors"
                :class="$route.path === '/admin/announcements' ? 'bg-brand-orange/10 text-brand-orange' : 'hover:bg-brand-orange/5'"
              >
                公告管理
              </router-link>
            </div>
          </div>

          <button 
            @click="handleLogout"
            class="px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="pt-20">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const handleLogout = () => {
  adminStore.signOut()
}
</script>