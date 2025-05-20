<template>
  <div class="schedule">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Schedule content will go here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const error = ref('')
const selectedDate = ref(new Date().toISOString().split('T')[0])

async function createPlan() {
  try {
    loading.value = true
    error.value = ''
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    if (!userInfo.pkUserInfo) {
      throw new Error('用户信息不完整，请重新登录')
    }

    const planData = {
      planDate: selectedDate.value,
      planName: `${selectedDate.value} 的学习计划`,
      fkUserInfo: {
        pkUserInfo: userInfo.pkUserInfo
      }
    }

    const response = await request('/api/createPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(planData)
    })

    if (!response) {
      throw new Error('创建计划失败：服务器未返回数据')
    }

    await loadPlanForDate(selectedDate.value)
  } catch (e: any) {
    console.error('创建计划失败:', e)
    error.value = e.message || '创建计划失败'
  } finally {
    loading.value = false
  }
}

// This function is referenced but not defined, adding a stub
async function loadPlanForDate(date: string) {
  // Implementation will be needed
}
</script>

<style scoped>
.schedule {
  padding: 1rem;
}

.error {
  color: red;
}
</style>