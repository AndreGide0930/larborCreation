<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { request, put, multipartPost } from '../utils/request'
import Toast from '../components/Toast.vue'
import Modal from '../components/Modal.vue'
import FormError from '../components/FormError.vue'

const authStore = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()

const editMode = ref(false)
const loading = ref(false)
const avatarLoading = ref(false)

// Toast 状态
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

// Modal 状态
const modal = ref({
  show: false,
  title: '',
  message: '',
  type: 'error' as 'error' | 'warning' | 'info'
})

// 表单验证错误
const formErrors = ref({
  username: '',
  email: '',
  phone: ''
})

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

// 显示 Toast
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.value = {
    show: true,
    message,
    type
  }
}

// 显示 Modal
const showModal = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
  modal.value = {
    show: true,
    title,
    message,
    type
  }
}

// 处理头像上传
const handleAvatarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showToast(t('profile.messages.selectImage'), 'error')
    return
  }

  // 验证文件大小（限制为 2MB）
  if (file.size > 2 * 1024 * 1024) {
    showToast(t('profile.messages.imageTooLarge'), 'error')
    return
  }

  try {
    avatarLoading.value = true

    const formData = new FormData()
    formData.append('file', file)
    formData.append('pkUserInfo', String(userInfo.value.pkUserInfo))

    const response = await request('/api/uploadAvatar', {
      method: 'PUT',
      body: formData
    })

    if (response && response.avatarUrl) {
      userProfile.value.avatar = response.avatarUrl
      
      const updatedUserInfo = {
        ...userInfo.value,
        avatar: response.avatarUrl
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      userInfo.value = updatedUserInfo

      showToast(t('profile.messages.avatarSuccess'), 'success')
    }
  } catch (error: any) {
    showModal(
      t('profile.uploadAvatar'),
      error.message || t('profile.messages.avatarFailed'),
      'error'
    )
  } finally {
    avatarLoading.value = false
  }
}

// 表单验证
const validateForm = () => {
  let isValid = true
  formErrors.value = {
    username: '',
    email: '',
    phone: ''
  }

  if (!userProfile.value.username) {
    formErrors.value.username = t('profile.messages.usernameRequired')
    isValid = false
  }

  if (userProfile.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userProfile.value.email)) {
    formErrors.value.email = t('profile.messages.invalidEmail')
    isValid = false
  }

  if (userProfile.value.phone && !/^\d{11}$/.test(userProfile.value.phone)) {
    formErrors.value.phone = t('profile.messages.invalidPhone')
    isValid = false
  }

  return isValid
}

const handleUpdateProfile = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    
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
      const updatedUserInfo = {
        ...userInfo.value,
        username: userProfile.value.username,
        email: userProfile.value.email,
        phone: userProfile.value.phone,
        avatar: userProfile.value.avatar
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      
      showToast(t('profile.messages.updateSuccess'), 'success')
      editMode.value = false
    }
  } catch (error: any) {
    showModal(
      t('profile.editProfile'),
      error.message || t('profile.messages.updateFailed'),
      'error'
    )
  } finally {
    loading.value = false
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

// 监听语言变化
watch(() => userProfile.value.preferences.language, (newValue) => {
  locale.value = newValue
  localStorage.setItem('language', newValue)
}, { immediate: true })

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  
  try {
    const response = await request('/api/ReadUser', {
      params: {
        pkUserInfo: userInfo.value.pkUserInfo
      }
    })
    
    if (response) {
      userProfile.value = {
        username: response.username || '',
        email: response.email || '',
        phone: response.phone || '',
        avatar: response.avatar || userProfile.value.avatar,
        preferences: {
          darkMode: localStorage.getItem('darkMode') === 'true',
          language: localStorage.getItem('language') || 'zh'
        }
      }
      
      localStorage.setItem('userInfo', JSON.stringify(response))
      userInfo.value = response
    }
  } catch (error: any) {
    showModal(
      t('profile.getUserFailed'),
      error.message || t('profile.messages.getUserFailed'),
      'error'
    )
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        {{ t('profile.title') }}
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
                {{ avatarLoading ? t('profile.uploading') : t('profile.uploadAvatar') }}
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
            <h2 class="text-2xl font-bold mb-2">{{ userProfile.username || t('profile.username') }}</h2>
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
            {{ t('profile.editProfile') }}
          </button>
        </div>

        <!-- Profile Form -->
        <form v-if="editMode" @submit.prevent="handleUpdateProfile" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('profile.username') }}</label>
              <input
                v-model="userProfile.username"
                type="text"
                class="glass w-full p-3 rounded-xl"
                :placeholder="t('profile.username')"
              >
              <FormError :message="formErrors.username" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ t('profile.email') }}</label>
              <input
                v-model="userProfile.email"
                type="email"
                class="glass w-full p-3 rounded-xl"
                :placeholder="t('profile.email')"
              >
              <FormError :message="formErrors.email" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ t('profile.phone') }}</label>
              <input
                v-model="userProfile.phone"
                type="tel"
                class="glass w-full p-3 rounded-xl"
                :placeholder="t('profile.phone')"
              >
              <FormError :message="formErrors.phone" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ t('profile.languagePreference') }}</label>
              <select
                v-model="userProfile.preferences.language"
                class="glass w-full p-3 rounded-xl"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div class="flex gap-4 mt-8">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all hover:opacity-90"
            >
              {{ loading ? t('profile.saving') : t('profile.save') }}
            </button>
            <button
              type="button"
              @click="editMode = false"
              class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              {{ t('profile.cancel') }}
            </button>
          </div>
        </form>

        <!-- Toast Component -->
        <Toast
          v-if="toast.show"
          :message="toast.message"
          :type="toast.type"
          @close="toast.show = false"
        />

        <!-- Modal Component -->
        <Modal
          v-model:show="modal.show"
          :title="modal.title"
          :message="modal.message"
          :type="modal.type"
          @close="modal.show = false"
        />

        <!-- Settings Section -->
        <div class="mt-8 pt-8 border-t border-brand-orange/10">
          <h3 class="text-xl font-medium mb-4">{{ t('profile.systemSettings') }}</h3>
          <div class="space-y-4">
            <label class="flex items-center justify-between p-4 glass rounded-xl cursor-pointer hover:bg-brand-orange/5 transition-colors">
              <span>{{ t('profile.darkMode') }}</span>
              <div class="relative">
                <input
                  v-model="userProfile.preferences.darkMode"
                  type="checkbox"
                  class="sr-only"
                >
                <div class="w-14 h-7 bg-gray-200 rounded-full transition-colors duration-200"
                  :class="{ 'bg-brand-orange': userProfile.preferences.darkMode }">
                  <div class="w-7 h-7 bg-white rounded-full shadow transform transition-transform duration-200"
                    :class="{ 'translate-x-7': userProfile.preferences.darkMode }"></div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Logout Button -->
        <div class="mt-8 pt-8 border-t border-brand-orange/10">
          <button
            @click="handleLogout"
            class="w-full glass py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            {{ t('profile.logout') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass {
  @apply bg-white/10 backdrop-blur border border-white/20;
}

.dark .glass {
  @apply bg-black/20 border-white/10;
}
</style>