import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')
  const verificationTimer = ref(0)
  const canResendCode = ref(true)

  const isAuthenticated = computed(() => !!user.value)

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

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signInError) throw signInError

      startResendTimer()
      return { success: true }
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
      await supabase.auth.signOut()
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

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updates
      })

      if (updateError) throw updateError

      user.value = data.user
      return { success: true }
    } catch (e: any) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })

  return {
    user,
    loading,
    error,
    verificationTimer,
    canResendCode,
    isAuthenticated,
    signInWithOTP,
    signOut,
    updateProfile
  }
})