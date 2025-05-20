<script setup lang="ts">
import { ref } from 'vue'
import { request } from '../utils/request'

const props = defineProps<{
  currentAvatar: string
}>()

const emit = defineEmits(['uploadSuccess'])

const loading = ref(false)
const error = ref('')

const handleFileSelect = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    error.value = '文件大小不能超过2MB'
    return
  }

  try {
    loading.value = true
    error.value = ''

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    const formData = new FormData()
    formData.append('file', file)

    const response = await request('/api/auth/uploadAvatar', {
      method: 'PUT',
      params: {
        pkUserInfo: userInfo.pkUserInfo
      },
      body: formData
    })

    if (typeof response === 'string') {
      emit('uploadSuccess', response)
    } else {
      throw new Error('上传失败')
    }
  } catch (err) {
    console.error('Avatar upload error:', err)
    error.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative">
    <img 
      :src="currentAvatar" 
      alt="Avatar"
      class="w-32 h-32 rounded-full object-cover neumorphic"
    >
    
    <div class="absolute -bottom-2 -right-2 flex gap-2">
      <input
        type="file"
        accept="image/*"
        class="hidden"
        id="avatar-upload"
        @change="handleFileSelect"
      >
      <label 
        for="avatar-upload"
        class="glass px-3 py-1 rounded-full hover:bg-brand-orange/10 transition-colors cursor-pointer"
        :class="{ 'opacity-50 cursor-not-allowed': loading }"
      >
        {{ loading ? '上传中...' : '更换头像' }}
      </label>
    </div>

    <p v-if="error" class="absolute top-full left-0 text-red-500 text-sm mt-1">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.glass {
  @apply bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm;
}

.neumorphic {
  box-shadow: 
    20px 20px 60px rgba(0, 0, 0, 0.05),
    -20px -20px 60px rgba(255, 255, 255, 0.8);
}

.dark .neumorphic {
  box-shadow: 
    20px 20px 60px rgba(0, 0, 0, 0.2),
    -20px -20px 60px rgba(255, 255, 255, 0.05);
}
</style>