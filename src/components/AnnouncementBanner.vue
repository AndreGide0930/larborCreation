<template>
  <div
    v-if="currentAnnouncement"
    class="fixed top-0 left-0 right-0 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-2 px-4 z-50"
  >
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-xl">📢</span>
        <span>{{ currentAnnouncement.title }}</span>
      </div>
      <button
        @click="dismissAnnouncement"
        class="text-white/80 hover:text-white transition-colors"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../utils/request'

interface Announcement {
  id: number
  title: string
  content: string
  createTime: string
  active: boolean
}

const currentAnnouncement = ref<Announcement | null>(null)

const fetchActiveAnnouncement = async () => {
  try {
    const response = await request('/api/announcements/active')
    if (response && response.length > 0) {
      const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
      const activeAnnouncement = response.find((a: Announcement) => !dismissedAnnouncements.includes(a.id))
      currentAnnouncement.value = activeAnnouncement || null
    }
  } catch (error) {
    console.error('Failed to fetch active announcement:', error)
  }
}

const dismissAnnouncement = () => {
  if (!currentAnnouncement.value) return

  const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
  dismissedAnnouncements.push(currentAnnouncement.value.id)
  localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements))
  currentAnnouncement.value = null
}

onMounted(fetchActiveAnnouncement)
</script>