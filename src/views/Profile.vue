<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { request, putJson, multipartPost } from '../utils/request'
import Toast from '../components/Toast.vue'
import Modal from '../components/Modal.vue'
import FormError from '../components/FormError.vue'
import SystemSettings from '../components/SystemSettings.vue'
import AvatarUpload from '../components/AvatarUpload.vue'

const authStore = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()

const editMode = ref(false)
const loading = ref(false)
const avatarLoading = ref(false)

// Toast state
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

// Modal state
const modal = ref({
  show: false,
  title: '',
  message: '',
  type: 'error' as 'error' | 'warning' | 'info'
})

// Form validation errors
const formErrors = ref({
  username: '',
  email: '',
  phone: ''
})

// Get user info from localStorage
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const userProfile = ref({
  username: userInfo.value.username || '',
  email: userInfo.value.email || '',
  phone: userInfo.value.phone || '',
  avatar: userInfo.value.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
  preferences: {
    darkMode: localStorage.getItem('darkMode') === 'true'
  }
})

// Show Toast
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.value = {
    show: true,
    message,
    type
  }
}

// Show Modal
const showModal = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
  modal.value = {
    show: true,
    title,
    message,
    type
  }
}

const handleAvatarUploadSuccess = async (url: string) => {
  try {
    // 先更新本地状态
    userProfile.value.avatar = url
    const updatedUserInfo = {
      ...userInfo.value,
      avatar: url
    }
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    userInfo.value = updatedUserInfo

    // 重新获取用户数据
    const response = await request('/api/ReadUser', {
      params: {
        pkUserInfo: userInfo.value.pkUserInfo
      }
    })
    
    if (response) {
      userProfile.value = {
        ...userProfile.value,
        username: response.username || '',
        email: response.email || '',
        phone: response.phone || '',
        avatar: response.avatar || url
      }
      
      localStorage.setItem('userInfo', JSON.stringify(response))
      userInfo.value = response
      showToast(t('profile.messages.avatarSuccess'), 'success')
    }
  } catch (error: any) {
    showModal(
      t('profile.uploadAvatar'),
      error.message || t('profile.messages.avatarFailed'),
      'error'
    )
  }
}

// Form validation
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

    const response = await putJson('/api/UpdateUser', userData)

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

// Watch dark mode changes
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
          darkMode: localStorage.getItem('darkMode') === 'true'
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
        <div class="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <AvatarUpload 
            :current-avatar="userProfile.avatar"
            @upload-success="handleAvatarUploadSuccess"
          />
          
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
          <SystemSettings />
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