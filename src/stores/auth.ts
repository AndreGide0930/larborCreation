import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')
  const verificationTimer = ref(0)
  const canResendCode = ref(true)

  const isAuthenticated = computed(() => !!localStorage.getItem('token'))

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

      const response = await axios.post('http://localhost:8080/auth/sendCode', { email })
      
      if (response.data.success) {
        startResendTimer()
        return { success: true }
      }

      throw new Error(response.data.message || 'Failed to send verification code')
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

      const response = await axios.post('http://localhost:8080/auth/verifyCode', { 
        email, 
        code 
      })

      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        user.value = response.data.user
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

  const signOut = async () => {
    try {
      loading.value = true
      error.value = ''
      localStorage.removeItem('token')
      user.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      loading.value = true
      error.value = ''

      const response = await axios.put('http://localhost:8080/auth/profile', updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        user.value = response.data.user
        return { success: true }
      }

      throw new Error('Failed to update profile')
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  // Initialize user from token
  const initializeAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await axios.get('http://localhost:8080/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        user.value = response.data.user
      } catch (e) {
        localStorage.removeItem('token')
        user.value = null
      }
    }
  }

  // Initialize auth state
  initializeAuth()

  return {
    user,
    loading,
    error,
    verificationTimer,
    canResendCode,
    isAuthenticated,
    signInWithOTP,
    verifyCode,
    signOut,
    updateProfile
  }
})