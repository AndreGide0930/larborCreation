<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { post, get } from '../utils/request'

const router = useRouter()

// 登录方式切换
const loginMethod = ref<'email' | 'normal'>('normal')

// 邮箱验证登录相关
const email = ref('')
const verificationCode = ref('')
const showVerification = ref(false)

// 常规登录相关
const username = ref('')
const password = ref('')

const loading = ref(false)
const error = ref('')
const verificationTimer = ref(0)
const canResendCode = ref(true)

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !email.value || emailRegex.test(email.value)
})

const canSubmit = computed(() => {
  if (loginMethod.value === 'email') {
    if (showVerification.value) {
      return verificationCode.value.length === 6
    }
    return email.value && isValidEmail.value
  } else {
    return email.value && username.value && isValidEmail.value
  }
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

// 邮箱验证码登录
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
      localStorage.setItem('token', response.token)
      localStorage.setItem('userInfo', JSON.stringify(response.userInfo))
      window.location.href = '/'
    } else {
      throw new Error('验证失败：服务器响应格式不正确')
    }
  } catch (e: any) {
    error.value = e.message || '验证失败'
  } finally {
    loading.value = false
  }
}

// 常规登录
const handleNormalLogin = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await get('/api/auth/login', {
      params: {
        email: email.value,
        username: username.value
      }
    })
    
    if (response && response.token && response.user) {
      localStorage.setItem('token', response.token)
      localStorage.setItem('userInfo', JSON.stringify(response.user))
      window.location.href = '/'
    } else {
      throw new Error('登录失败：服务器响应格式不正确')
    }
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}

const switchLoginMethod = (method: 'email' | 'normal') => {
  loginMethod.value = method
  error.value = ''
  if (method === 'normal') {
    showVerification.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-mint/30 p-4">
    <div class="neumorphic w-full max-w-md p-8 rounded-2xl">
      <h1 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        欢迎回来
      </h1>

      <!-- 登录方式切换 -->
      <div class="flex gap-4 mb-8">
        <button
          @click="switchLoginMethod('normal')"
          class="flex-1 py-2 rounded-xl transition-all"
          :class="loginMethod === 'normal' ? 'glass bg-brand-orange/10' : 'glass hover:bg-brand-orange/5'"
        >
          常规登录
        </button>
        <button
          @click="switchLoginMethod('email')"
          class="flex-1 py-2 rounded-xl transition-all"
          :class="loginMethod === 'email' ? 'glass bg-brand-orange/10' : 'glass hover:bg-brand-orange/5'"
        >
          邮箱验证登录
        </button>
      </div>

      <!-- 常规登录表单 -->
      <div v-if="loginMethod === 'normal'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">邮箱地址</label>
          <input
            v-model="email"
            type="email"
            class="glass w-full p-3 rounded-xl"
            :class="{ 'border-red-500': email && !isValidEmail }"
            placeholder="请输入邮箱地址"
          >
          <p v-if="email && !isValidEmail" class="mt-1 text-sm text-red-500">
            请输入有效的邮箱地址
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">用户名</label>
          <input
            v-model="username"
            type="text"
            class="glass w-full p-3 rounded-xl"
            placeholder="请输入用户名"
          >
        </div>

        <button
          @click="handleNormalLogin"
          :disabled="!canSubmit || loading"
          class="w-full mt-6 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
          :class="canSubmit && !loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
        >
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </div>

      <!-- 邮箱验证登录表单 -->
      <div v-else>
        <div v-if="!showVerification" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">邮箱地址</label>
            <input
              v-model="email"
              type="email"
              class="glass w-full p-3 rounded-xl"
              :class="{ 'border-red-500': email && !isValidEmail }"
              placeholder="请输入邮箱地址"
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
      </div>

      <p v-if="error" class="mt-4 text-red-500 text-center">
        {{ error }}
      </p>

      <div class="mt-8 text-center">
        <p class="text-brand-blue/60 dark:text-white/60">
          还没有账号？
          <router-link to="/register" class="text-brand-orange hover:underline">
            立即注册
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>