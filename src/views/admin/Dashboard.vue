<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        管理员控制台
      </h1>
      <p class="text-brand-blue/60 dark:text-white/60">
        管理用户、公告和系统设置
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- 用户管理卡片 -->
      <div class="neumorphic p-6 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4">用户管理</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span>总用户数</span>
            <span class="text-2xl font-bold text-brand-orange">{{ stats.totalUsers }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>活跃用户</span>
            <span class="text-2xl font-bold text-brand-mint">{{ stats.activeUsers }}</span>
          </div>
          <button
            @click="router.push('/admin/users')"
            class="w-full glass px-4 py-2 rounded-xl hover:bg-brand-orange/10 transition-colors mt-4"
          >
            管理用户
          </button>
        </div>
      </div>

      <!-- 公告管理卡片 -->
      <div class="neumorphic p-6 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4">公告管理</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span>总公告数</span>
            <span class="text-2xl font-bold text-brand-orange">{{ stats.totalAnnouncements }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>活动公告</span>
            <span class="text-2xl font-bold text-brand-mint">{{ stats.activeAnnouncements }}</span>
          </div>
          <button
            @click="router.push('/admin/announcements')"
            class="w-full glass px-4 py-2 rounded-xl hover:bg-brand-orange/10 transition-colors mt-4"
          >
            管理公告
          </button>
        </div>
      </div>

      <!-- 系统设置卡片 -->
      <div class="neumorphic p-6 rounded-2xl">
        <h2 class="text-2xl font-bold mb-4">系统设置</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span>系统状态</span>
            <span class="text-2xl font-bold text-green-500">正常</span>
          </div>
          <button
            @click="router.push('/admin/settings')"
            class="w-full glass px-4 py-2 rounded-xl hover:bg-brand-orange/10 transition-colors mt-4"
          >
            系统设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../../utils/request'

const router = useRouter()
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalAnnouncements: 0,
  activeAnnouncements: 0
})

onMounted(async () => {
  try {
    const response = await request('/api/admin/stats')
    stats.value = response
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
  }
})
</script>