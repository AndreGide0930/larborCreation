<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { request, put, multipartPost } from '../utils/request'

const authStore = useAuthStore()
const router = useRouter()

const editMode = ref(false)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const avatarLoading = ref(false)

// 从本地存储获取用户信息
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const userProfile = ref({
  username: userInfo.value.username || '',
  email: userInfo.value.email || '',
  phone: userInfo.value.phone || '',
  avatar: userInfo.value.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
  preferences: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    language: 'zh'
  }
})

// 处理头像上传
const handleAvatarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择图片文件'
    return
  }

  // 验证文件大小（限制为 2MB）
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = '图片大小不能超过 2MB'
    return
  }

  try {
    avatarLoading.value = true
    errorMessage.value = ''

    const formData = new FormData()
    formData.append('file', file)
    formData.append('pkUserInfo', String(userInfo.value.pkUserInfo))

    const response = await request('/api/uploadAvatar', {
      method: 'PUT',
      body: formData
    })

    if (response && response.avatarUrl) {
      // 更新头像URL
      userProfile.value.avatar = response.avatarUrl
      
      // 更新本地存储
      const updatedUserInfo = {
        ...userInfo.value,
        avatar: response.avatarUrl
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      userInfo.value = updatedUserInfo

      successMessage.value = response.message || '头像上传成功'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || '头像上传失败'
  } finally {
    avatarLoading.value = false
  }
}

// 监听深色模式变化
watch(() => userProfile.value.preferences.darkMode, (newValue) => {
  if (newValue) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('darkMode', String(newValue))
}, { immediate: true })

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  
  try {
    // 调用 ReadUser 接口获取最新的用户信息
    const response = await request('/api/ReadUser', {
      params: {
        pkUserInfo: userInfo.value.pkUserInfo
      }
    })
    
    if (response) {
      // 更新用户信息
      userProfile.value = {
        username: response.username || '',
        email: response.email || '',
        phone: response.phone || '',
        avatar: response.avatar || userProfile.value.avatar,
        preferences: {
          darkMode: localStorage.getItem('darkMode') === 'true',
          language: userProfile.value.preferences.language
        }
      }
      
      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(response))
      userInfo.value = response
    }
  } catch (error: any) {
    errorMessage.value = error.message || '获取用户信息失败'
  }
})

const handleUpdateProfile = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    const userData = {
      pkUserInfo: userInfo.value.pkUserInfo,
      username: userProfile.value.username,
      email: userProfile.value.email,
      phone: userProfile.value.phone,
      avatar: userProfile.value.avatar,
      enabled: true
    }

    const response = await put('/api/UpdateUser', userData)

    if (response) {
      // 更新本地存储的用户信息
      const updatedUserInfo = {
        ...userInfo.value,
        username: userProfile.value.username,
        email: userProfile.value.email,
        phone: userProfile.value.phone,
        avatar: userProfile.value.avatar
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      
      successMessage.value = '个人信息更新成功'
      editMode.value = false
      
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || '更新失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        个人中心
      </h1>

      <div class="neumorphic rounded-2xl p-8">
        <!-- Profile Header -->
        <div class="flex items-center gap-8 mb-12">
          <div class="relative">
            <img 
              :src="userProfile.avatar" 
              :alt="userProfile.username"
              class="w-32 h-32 rounded-full object-cover neumorphic"
            >
            <div 
              v-if="editMode"
              class="absolute bottom-0 right-0 flex gap-2"
            >
              <input
                type="file"
                accept="image/*"
                class="hidden"
                id="avatar-upload"
                @change="handleAvatarUpload"
              >
              <label 
                for="avatar-upload"
                class="glass p-2 rounded-full hover:bg-brand-orange/10 transition-colors cursor-pointer"
                :class="{ 'opacity-50 cursor-not-allowed': avatarLoading }"
              >
                {{ avatarLoading ? '上传中...' : '📷' }}
              </label>
              <button 
                @click="userProfile.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random()"
                class="glass p-2 rounded-full hover:bg-brand-orange/10 transition-colors"
                :disabled="avatarLoading"
              >
                🔄
              </button>
            </div>
          </div>
          
          <div class="flex-1">
            <h2 class="text-2xl font-bold mb-2">{{ userProfile.username || '未设置用户名' }}</h2>
            <div class="space-y-1 text-brand-blue/60 dark:text-white/60">
              <p v-if="userProfile.email">📧 {{ userProfile.email }}</p>
              <p v-if="userProfile.phone">📱 {{ userProfile.phone }}</p>
            </div>
          </div>

          <button 
            v-if="!editMode"
            @click="editMode = true"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
          >
            编辑资料
          </button>
        </div>

        <!-- Profile Form -->
        <form @submit.prevent="handleUpdateProfile" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">用户名</label>
              <input
                v-model="userProfile.username"
                type="text"
                :disabled="!editMode"
                class="glass w-full p-3 rounded-xl disabled:opacity-50"
                placeholder="设置用户名"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">语言偏好</label>
              <select
                v-model="userProfile.preferences.language"
                :disabled="!editMode"
                class="glass w-full p-3 rounded-xl disabled:opacity-50"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div class="space-y-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="userProfile.preferences.darkMode"
                type="checkbox"
                :disabled="!editMode"
                class="w-5 h-5 rounded-lg accent-brand-orange"
              >
              <span>深色模式</span>
            </label>
          </div>

          <div v-if="editMode" class="flex gap-4 mt-8">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
            >
              {{ loading ? '保存中...' : '保存修改' }}
            </button>
            <button
              type="button"
              @click="editMode = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              取消
            </button>
          </div>
        </form>

        <!-- Messages -->
        <div class="mt-6">
          <p v-if="successMessage" class="text-green-500 text-center">{{ successMessage }}</p>
          <p v-if="errorMessage" class="text-red-500 text-center">{{ errorMessage }}</p>
        </div>

        <!-- Logout Button -->
        <div class="mt-12 pt-8 border-t border-brand-orange/10">
          <button
            @click="handleLogout"
            class="w-full glass py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>