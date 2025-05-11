<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../utils/request'

interface Project {
  id: number
  name: string
  type: string
  cweight: number
  cpriority: number
  createTime: string
  updateTime: string
  coverImage: string
  file?: File
  description?: string
}

const projects = ref<Project[]>([])
const showUploadForm = ref(false)
const newProject = ref<Project>({
  id: 0,
  name: '',
  type: 'notes',
  cweight: 0,
  cpriority: 3,
  createTime: new Date().toISOString(),
  updateTime: new Date().toISOString(),
  coverImage: 'https://picsum.photos/300/200',
  description: ''
})
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const priorityLabels = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High'
}

const priorityColors = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-100 text-blue-600',
  3: 'bg-green-100 text-green-600',
  4: 'bg-orange-100 text-orange-600',
  5: 'bg-red-100 text-red-600'
}

const fetchWithRetry = async (url: string, retries = 3): Promise<Project[]> => {
  for (let i = 0; i < retries; i++) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          // 如果未认证，重定向到登录页面
          router.push('/login')
          throw new Error('未登录或登录已过期')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Failed after retries')
}

// Fetch projects from the server
const fetchProjects = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await get('/api/readAllWorks')
    projects.value = data
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
      // 如果是未登录错误，不要重试
      if (error.value.includes('未登录')) {
        return
      }
    } else {
      error.value = '加载失败，请稍后重试'
    }
    console.error('Error fetching projects:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newProject.value.coverImage = e.target.result as string
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

const addProject = () => {
  const projectToAdd: Project = {
    ...newProject.value,
    id: Date.now(),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    file: selectedFile.value || undefined
  }
  
  projects.value.unshift(projectToAdd)
  
  // Reset form
  newProject.value = {
    id: 0,
    name: '',
    type: 'notes',
    cweight: 0,
    cpriority: 3,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    coverImage: 'https://picsum.photos/300/200',
    description: ''
  }
  selectedFile.value = null
  showUploadForm.value = false
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航栏 -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        My Portfolio
      </h1>
      
      <!-- 用户信息和退出按钮 -->
      <div class="flex items-center gap-4">
        <div class="text-sm text-brand-blue/60 dark:text-white/60">
          {{ userInfo.username || userInfo.email }}
        </div>
        <button 
          @click="handleLogout"
          class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-4">
      加载中...
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="text-red-500 text-center py-4">
      {{ error }}
    </div>

    <!-- Upload Button -->
    <button 
      @click="showUploadForm = true"
      class="neumorphic fixed right-8 top-8 p-4 rounded-full hover:scale-105 transition-transform"
    >
      <span class="text-2xl">+</span>
    </button>

    <!-- Filter Section -->
    <div class="neumorphic p-4 mb-8 rounded-lg">
      <div class="flex gap-4">
        <input 
          type="text" 
          placeholder="Search..." 
          class="glass p-2 rounded-lg flex-1"
        >
      </div>
    </div>

    <!-- Projects Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="project in projects" 
        :key="project.id"
        class="neumorphic rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
      >
        <img :src="project.coverImage" :alt="project.name" class="w-full h-48 object-cover">
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl">{{ project.name }}</h3>
            <span 
              class="text-sm px-2 py-1 rounded-full"
              :class="priorityColors[project.cpriority as keyof typeof priorityColors]"
            >
              {{ priorityLabels[project.cpriority as keyof typeof priorityLabels] }}
            </span>
          </div>
          <div class="flex gap-2 mb-2">
            <span class="glass px-2 py-1 rounded-full text-sm">{{ project.type }}</span>
            <span class="glass px-2 py-1 rounded-full text-sm">Weight: {{ project.cweight }}</span>
          </div>
          <p v-if="project.description" class="mt-2 text-sm opacity-75">{{ project.description }}</p>
          <div class="mt-2 text-xs text-brand-blue/60 dark:text-white/60">
            Updated: {{ new Date(project.updateTime).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Form Modal -->
    <div 
      v-if="showUploadForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showUploadForm = false"
    >
      <form 
        @submit.prevent="addProject"
        class="neumorphic p-6 rounded-lg w-full max-w-md"
      >
        <h2 class="text-2xl mb-6 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">Add New Project</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block mb-1">Project Name</label>
            <input 
              v-model="newProject.name"
              type="text"
              required
              class="glass w-full p-2 rounded-lg"
            >
          </div>

          <div>
            <label class="block mb-1">Type</label>
            <select 
              v-model="newProject.type"
              class="glass w-full p-2 rounded-lg"
            >
              <option value="notes">Notes</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="research">Research</option>
            </select>
          </div>

          <div>
            <label class="block mb-1">Priority Level</label>
            <div class="flex gap-2">
              <label 
                v-for="n in 5" 
                :key="n"
                class="flex-1 cursor-pointer"
              >
                <input 
                  type="radio" 
                  :value="n"
                  v-model="newProject.cpriority"
                  class="sr-only"
                >
                <div 
                  class="text-center p-2 rounded-lg transition-all"
                  :class="[
                    newProject.cpriority === n 
                      ? priorityColors[n as keyof typeof priorityColors] 
                      : 'glass hover:bg-brand-orange/10'
                  ]"
                >
                  {{ n }}
                </div>
              </label>
            </div>
            <div class="text-sm text-center mt-1 text-brand-blue/60 dark:text-white/60">
              {{ priorityLabels[newProject.cpriority as keyof typeof priorityLabels] }}
            </div>
          </div>

          <div>
            <label class="block mb-1">Weight</label>
            <input 
              v-model="newProject.cweight"
              type="number"
              min="0"
              required
              class="glass w-full p-2 rounded-lg"
            >
          </div>

          <div>
            <label class="block mb-1">Description</label>
            <textarea 
              v-model="newProject.description"
              rows="3"
              class="glass w-full p-2 rounded-lg"
            ></textarea>
          </div>

          <div>
            <label class="block mb-1">Cover Image</label>
            <input 
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="glass w-full p-2 rounded-lg"
            >
            <div v-if="newProject.coverImage" class="mt-2">
              <img 
                :src="newProject.coverImage" 
                alt="Preview" 
                class="w-full h-32 object-cover rounded-lg"
              >
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button 
            type="submit"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors flex-1"
          >
            Add Project
          </button>
          <button 
            type="button"
            @click="showUploadForm = false"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>