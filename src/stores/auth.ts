import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth'

interface User {
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')
  const verificationTimer = ref(0)
  const canResendCode = ref(true)

  const isAuthenticated = computed(() => authService.isAuthenticated())

  const startVerificationTimer = () => {
    verificationTimer.value = 60
    canResendCode.value = false
    const timer = setInterval(() => {
      verificationTimer.value--
      if (verificationTimer.value <= 0) {
        clearInterval(timer)
        canResendCode.value = true
      }
    }, 1000)
  }

  const signInWithOTP = async (email: string) => {
    try {
      loading.value = true
      error.value = ''

      const result = await authService.sendVerificationCode(email)
      
      if (result.success) {
        startVerificationTimer()
      } else {
        error.value = result.error || '发送验证码失败'
      }

      return { success: result.success }
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const verifyOTP = async (email: string, code: string) => {
    try {
      loading.value = true
      error.value = ''

      const result = await authService.verifyCode(email, code)
      
      if (result.success && result.data?.user) {
        user.value = result.data.user
      } else {
        error.value = result.error || '验证失败'
      }

      return { success: result.success }
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      loading.value = true
      error.value = ''

      const result = await authService.updateProfile(updates)
      
      if (result.success) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          user.value = JSON.parse(storedUser)
        }
      } else {
        error.value = result.error || '更新失败'
      }

      return { success: result.success }
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      error.value = ''
      
      authService.logout()
      user.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      loading.value = true
      
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    verificationTimer,
    canResendCode,
    signInWithOTP,
    verifyOTP,
    updateProfile,
    signOut,
    checkAuth
  }
})