<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const verificationCode = ref('')
const showVerification = ref(false)

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !email.value || emailRegex.test(email.value)
})

const canSubmit = computed(() => {
  if (showVerification.value) {
    return verificationCode.value.length === 6
  }
  return email.value && isValidEmail.value
})

const handleSendCode = async () => {
  if (!canSubmit.value) return

  const result = await authStore.signInWithOTP(email.value)

  if (result.success) {
    showVerification.value = true
  }
}

const handleVerify = async () => {
  if (!verificationCode.value) return

  try {
    const response = await fetch('/auth/verifyCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        code: verificationCode.value
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      // 保存token到localStorage
      localStorage.setItem('token', data.token)
      // 可以选择是否保存用户信息
      localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
      router.push('/')
    } else {
      authStore.error = data.error || '验证失败'
    }
  } catch (error) {
    authStore.error = '验证过程发生错误'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-mint/30 p-4">
    <div class="neumorphic w-full max-w-md p-8 rounded-2xl">
      <h1 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        创建账号
      </h1>

      <div v-if="!showVerification">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">邮箱地址</label>
            <input
              v-model="email"
              type="email"
              class="glass w-full p-3 rounded-xl"
              :class="{ 'border-red-500': email && !isValidEmail }"
              placeholder="请输入邮箱地址"
              required
            >
            <p v-if="email && !isValidEmail" class="mt-1 text-sm text-red-500">
              请输入有效的邮箱地址
            </p>
          </div>
        </div>

        <button
          @click="handleSendCode"
          :disabled="!canSubmit || authStore.loading"
          class="w-full mt-6 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
          :class="canSubmit && !authStore.loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
        >
          <span v-if="authStore.loading">发送中...</span>
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
            :disabled="!authStore.canResendCode"
            class="mt-2 text-brand-orange hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {{ authStore.canResendCode ? '重新发送' : `${authStore.verificationTimer}秒后重试` }}
          </button>
        </div>

        <button
          @click="handleVerify"
          :disabled="verificationCode.length !== 6 || authStore.loading"
          class="w-full bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
          :class="verificationCode.length === 6 && !authStore.loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
        >
          <span v-if="authStore.loading">验证中...</span>
          <span v-else>创建账号</span>
        </button>

        <button
          @click="showVerification = false"
          class="w-full mt-4 glass py-3 rounded-xl font-medium hover:bg-brand-orange/10 transition-colors"
        >
          返回
        </button>
      </div>

      <p v-if="authStore.error" class="mt-4 text-red-500 text-center">
        {{ authStore.error }}
      </p>

      <div class="mt-8 text-center">
        <p class="text-brand-blue/60 dark:text-white/60">
          已有账号？
          <router-link to="/login" class="text-brand-orange hover:underline">
            立即登录
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>