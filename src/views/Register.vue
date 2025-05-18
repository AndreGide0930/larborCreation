<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '../utils/request'

const router = useRouter()

const email = ref('')
const username = ref('')
const loading = ref(false)
const error = ref('')

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !email.value || emailRegex.test(email.value)
})

const canSubmit = computed(() => {
  return email.value && username.value && isValidEmail.value
})

const handleRegister = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await post('/api/auth/register', {
      email: email.value,
      username: username.value,
      enabled: false
    })

    if (response === '注册成功') {
      // 注册成功后跳转到登录页，使用完整页面刷新
      window.location.href = '/login'
    } else {
      throw new Error('注册失败：服务器响应格式不正确')
    }
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-mint/30 p-4">
    <div class="neumorphic w-full max-w-md p-8 rounded-2xl">
      <h1 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        创建账号
      </h1>

      <div class="space-y-4">
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
      </div>

      <button
        @click="handleRegister"
        :disabled="!canSubmit || loading"
        class="w-full mt-6 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
        :class="canSubmit && !loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
      >
        <span v-if="loading">注册中...</span>
        <span v-else>注册</span>
      </button>

      <p v-if="error" class="mt-4 text-red-500 text-center">
        {{ error }}
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