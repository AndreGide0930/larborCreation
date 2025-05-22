<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-mint/30 p-4">
    <div class="neumorphic w-full max-w-md p-8 rounded-2xl">
      <h1 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        管理员登录
      </h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">用户名</label>
          <input
            v-model="username"
            type="text"
            class="glass w-full p-3 rounded-xl"
            placeholder="请输入管理员用户名"
          >
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">密码</label>
          <input
            v-model="password"
            type="password"
            class="glass w-full p-3 rounded-xl"
            placeholder="请输入密码"
          >
        </div>
      </div>

      <button
        @click="handleLogin"
        :disabled="!canSubmit || loading"
        class="w-full mt-6 bg-gradient-to-r from-brand-orange to-brand-mint text-white py-3 rounded-xl font-medium transition-all"
        :class="canSubmit && !loading ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'"
      >
        <span v-if="loading">登录中...</span>
        <span v-else>登录</span>
      </button>

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
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const canSubmit = computed(() => {
  return username.value && password.value
})

const handleLogin = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await post('/api/auth/adminLogin', {
      username: username.value,
      password: password.value
    })

    if (response && response.token) {
      localStorage.setItem('adminToken', response.token)
      localStorage.setItem('adminInfo', JSON.stringify(response.admin))
      router.push('/admin/dashboard')
    } else {
      throw new Error('登录失败：服务器响应格式不正确')
    }
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>