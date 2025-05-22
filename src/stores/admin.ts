import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '../utils/request'

export const useAdminStore = defineStore('admin', () => {
  const loading = ref(false)
  const error = ref('')
  const verificationTimer = ref(0)
  const canResendCode = ref(true)

  const isAuthenticated = computed(() => !!localStorage.getItem('adminToken'))

  const startResendTimer = () => {
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

      const response = await request('/api/auth/adminLogin', {
        method: 'POST',
        params: { email }
      })
      
      if (response === '验证码已发送') {
        startResendTimer()
        return { success: true }
      }

      throw new Error('Failed to send verification code')
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const verifyCode = async (email: string, code: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await request('/api/auth/verifyCode', {
        method: 'POST',
        params: { email, code }
      })

      if (response.token) {
        localStorage.setItem('adminToken', response.token)
        localStorage.setItem('adminInfo', JSON.stringify(response.userInfo))
        return { success: true }
      }

      throw new Error('Verification failed')
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const signOut = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminInfo')
    window.location.href = '/admin/login'
  }

  return {
    loading,
    error,
    verificationTimer,
    canResendCode,
    isAuthenticated,
    signInWithOTP,
    verifyCode,
    signOut
  }
})