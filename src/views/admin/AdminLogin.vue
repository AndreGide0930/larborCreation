```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-mint/30 p-4">
    <div class="neumorphic w-full max-w-md p-8 rounded-2xl">
      <h1 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        管理员登录
      </h1>

      <div v-if="!showVerification" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">邮箱地址</label>
          <input
            v-model="email"
            type="email"
            class="glass w-full p-3 rounded-xl"
            :class="{ 'border-red-500': email && !isValidEmail }"
            placeholder="请输入管理员邮箱"
          >
          <p v-if="email && !isValidEmail" class="mt-1 text-sm text-red-500">
            请输入有效的邮箱地址
          </p>
        </div>

        <button
          @click="handleSendCode"
          :disabled="!canSubmit || loading"
          class="w-full mt-6 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
          :class="canSubmit && !loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
        >
          <span v-if="loading">发送中...</span>
          <span v-else>发送验证码</span>
        </button>
      </div>

      <div v-else class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-1">验证码</label>
          <input
            v-model="verificationCode"
            type="text"
            maxlength="6"
            class="glass w-full p-3 rounded-xl text-center text-2xl tracking-wider"
            placeholder="请输入验证码"
          >
        </div>

        <div class="text-center">
          <p class="text-sm text-brand-blue/60 dark:text-white/60">
            没有收到验证码？
          </p>
          <button
            @click="handleSendCode"
            :disabled="!canResendCode"
            class="mt-2 text-brand-orange hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {{ canResendCode ? '重新发送' : `${verificationTimer}秒后重试` }}
          </button>
        </div>

        <button
          @click="handleVerify"
          :disabled="verificationCode.length !== 6 || loading"
          class="w-full bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
          :class="verificationCode.length === 6 && !loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
        >
          <span v-if="loading">验证中...</span>
          <span v-else>验证并登录</span>
        </button>

        <button
          @click="showVerification = false"
          class="w-full mt-4 glass py-3 rounded-xl font-medium hover:bg-brand-orange/10 transition-colors"
        >
          返回
        </button>
      </div>

      <p v-if="error" class="mt-4 text-red-500 text-center">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '../../utils/request'

const router = useRouter()
const email = ref('')
const verificationCode = ref('')
const loading = ref(false)
const error = ref('')
const showVerification = ref(false)
const verificationTimer = ref(0)
const canResendCode = ref(true)

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !email.value || emailRegex.test(email.value)
})

const canSubmit = computed(() => {
  return email.value && isValidEmail.value
})

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

const handleSendCode = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const result = await post('/api/auth/sendCode', null, {
      params: { email: email.value }
    })
    if (result === '验证码已发送') {
      showVerification.value = true
      startResendTimer()
    } else {
      throw new Error('服务器响应格式错误')
    }
  } catch (e: any) {
    error.value = e.message || '发送验证码失败'
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  if (!verificationCode.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await post('/api/auth/verifyCode', null, {
      params: {
        email: email.value,
        code: verificationCode.value
      }
    })
    
    if (response && response.token && response.userInfo) {
      localStorage.setItem('adminToken', response.token)
      localStorage.setItem('adminInfo', JSON.stringify(response.userInfo))
      router.push('/admin/dashboard')
    } else {
      throw new Error('验证失败：服务器响应格式不正确')
    }
  } catch (e: any) {
    error.value = e.message || '验证失败'
  } finally {
    loading.value = false
  }
}
</script>
```