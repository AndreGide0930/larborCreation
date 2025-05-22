<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl mb-8 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
      用户管理
    </h1>

    <div class="neumorphic p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-6">
        <div class="flex gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索用户..."
            class="glass px-4 py-2 rounded-xl"
          >
          <button
            @click="handleSearch"
            class="glass px-4 py-2 rounded-xl hover:bg-brand-orange/10 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-brand-orange/10">
              <th class="py-4 px-6 text-left">ID</th>
              <th class="py-4 px-6 text-left">用户名</th>
              <th class="py-4 px-6 text-left">邮箱</th>
              <th class="py-4 px-6 text-left">状态</th>
              <th class="py-4 px-6 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.pkUserInfo"
              class="border-b border-brand-orange/10"
            >
              <td class="py-4 px-6">{{ user.pkUserInfo }}</td>
              <td class="py-4 px-6">{{ user.username }}</td>
              <td class="py-4 px-6">{{ user.email }}</td>
              <td class="py-4 px-6">
                <span
                  class="px-2 py-1 rounded-full text-sm"
                  :class="user.enabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'"
                >
                  {{ user.enabled ? '启用' : '禁用' }}
                </span>
              </td>
              <td class="py-4 px-6">
                <button
                  @click="toggleUserStatus(user)"
                  class="glass px-3 py-1 rounded-lg text-sm hover:bg-brand-orange/10 transition-colors mr-2"
                >
                  {{ user.enabled ? '禁用' : '启用' }}
                </button>
                <button
                  @click="deleteUser(user.pkUserInfo)"
                  class="glass px-3 py-1 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'

interface User {
  pkUserInfo: number
  username: string
  email: string
  enabled: boolean
}

const users = ref<User[]>([])
const searchQuery = ref('')

const fetchUsers = async () => {
  try {
    const response = await request('/api/admin/users')
    users.value = response
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}

const handleSearch = async () => {
  try {
    const response = await request('/api/admin/users/search', {
      params: { query: searchQuery.value }
    })
    users.value = response
  } catch (error) {
    console.error('Failed to search users:', error)
  }
}

const toggleUserStatus = async (user: User) => {
  try {
    await request('/api/admin/users/toggle-status', {
      method: 'POST',
      params: { pkUserInfo: user.pkUserInfo }
    })
    await fetchUsers()
  } catch (error) {
    console.error('Failed to toggle user status:', error)
  }
}

const deleteUser = async (pkUserInfo: number) => {
  if (!confirm('确定要删除此用户吗？此操作不可撤销。')) return

  try {
    await request('/api/admin/users/delete', {
      method: 'DELETE',
      params: { pkUserInfo }
    })
    await fetchUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
}

onMounted(fetchUsers)
</script>