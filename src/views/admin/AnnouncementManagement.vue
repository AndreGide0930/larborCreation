<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        公告管理
      </h1>
      <button
        @click="showNewAnnouncementForm = true"
        class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
      >
        发布公告
      </button>
    </div>

    <div class="neumorphic p-6 rounded-2xl">
      <div class="space-y-4">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="glass p-4 rounded-xl"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-semibold mb-2">{{ announcement.title }}</h3>
              <p class="text-brand-blue/60 dark:text-white/60">{{ announcement.content }}</p>
              <div class="flex gap-4 mt-2 text-sm">
                <span class="text-brand-orange">
                  发布时间: {{ new Date(announcement.createTime).toLocaleString() }}
                </span>
                <span
                  :class="announcement.active ? 'text-green-500' : 'text-red-500'"
                >
                  {{ announcement.active ? '活动' : '已结束' }}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="editAnnouncement(announcement)"
                class="glass px-3 py-1 rounded-lg text-sm hover:bg-brand-orange/10 transition-colors"
              >
                编辑
              </button>
              <button
                @click="deleteAnnouncement(announcement.id)"
                class="glass px-3 py-1 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New/Edit Announcement Modal -->
    <div
      v-if="showNewAnnouncementForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showNewAnnouncementForm = false"
    >
      <div class="neumorphic p-6 rounded-2xl w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">
          {{ editingAnnouncement ? '编辑公告' : '发布新公告' }}
        </h2>

        <form @submit.prevent="handleSubmitAnnouncement" class="space-y-4">
          <div>
            <label class="block mb-2">标题</label>
            <input
              v-model="announcementForm.title"
              type="text"
              required
              class="glass w-full p-3 rounded-xl"
              placeholder="公告标题"
            >
          </div>

          <div>
            <label class="block mb-2">内容</label>
            <textarea
              v-model="announcementForm.content"
              required
              rows="4"
              class="glass w-full p-3 rounded-xl"
              placeholder="公告内容"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="announcementForm.active"
              type="checkbox"
              id="active"
              class="w-4 h-4 rounded accent-brand-orange"
            >
            <label for="active">立即发布</label>
          </div>

          <div class="flex gap-4 mt-6">
            <button
              type="submit"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
              :disabled="loading"
            >
              {{ loading ? '提交中...' : (editingAnnouncement ? '更新' : '发布') }}
            </button>
            <button
              type="button"
              @click="showNewAnnouncementForm = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'

interface Announcement {
  id: number
  title: string
  content: string
  createTime: string
  active: boolean
}

const announcements = ref<Announcement[]>([])
const showNewAnnouncementForm = ref(false)
const loading = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)

const announcementForm = ref({
  title: '',
  content: '',
  active: true
})

const fetchAnnouncements = async () => {
  try {
    const response = await request('/api/announcements')
    announcements.value = response
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
  }
}

const handleSubmitAnnouncement = async () => {
  try {
    loading.value = true
    const payload = {
      ...announcementForm.value,
      id: editingAnnouncement.value?.id
    }

    if (editingAnnouncement.value) {
      await request(`/api/announcements/${editingAnnouncement.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
    } else {
      await request('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }

    await fetchAnnouncements()
    showNewAnnouncementForm.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to submit announcement:', error)
  } finally {
    loading.value = false
  }
}

const editAnnouncement = (announcement: Announcement) => {
  editingAnnouncement.value = announcement
  announcementForm.value = {
    title: announcement.title,
    content: announcement.content,
    active: announcement.active
  }
  showNewAnnouncementForm.value = true
}

const deleteAnnouncement = async (id: number) => {
  if (!confirm('确定要删除此公告吗？')) return

  try {
    await request(`/api/announcements/${id}`, {
      method: 'DELETE'
    })
    await fetchAnnouncements()
  } catch (error) {
    console.error('Failed to delete announcement:', error)
  }
}

const resetForm = () => {
  announcementForm.value = {
    title: '',
    content: '',
    active: true
  }
  editingAnnouncement.value = null
}

onMounted(fetchAnnouncements)
</script>