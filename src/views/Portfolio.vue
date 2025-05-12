<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../utils/request'

interface DoneWork {
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

const DoneWorks = ref<DoneWork[]>([])
const showUploadForm = ref(false)
const newDoneWork = ref<DoneWork>({
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
  1: '非常低',
  2: '低',
  3: '中等',
  4: '高',
  5: '非常高'
}

const priorityColors = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-100 text-blue-600',
  3: 'bg-green-100 text-green-600',
  4: 'bg-orange-100 text-orange-600',
  5: 'bg-red-100 text-red-600'
}

const fetchDoneWorks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await request('/readAllWorks')
    DoneWorks.value = data
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
      if (error.value.includes('未登录')) {
        return
      }
    } else {
      error.value = '加载失败，请稍后重试'
    }
    console.error('Error fetching DoneWorks:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDoneWorks()
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newDoneWork.value.coverImage = e.target.result as string
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

const addDoneWork = () => {
  const DoneWorkToAdd: DoneWork = {
    ...newDoneWork.value,
    id: Date.now(),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    file: selectedFile.value || undefined
  }
  
  DoneWorks.value.unshift(DoneWorkToAdd)
  
  newDoneWork.value = {
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
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        我的作品集
      </h1>
      
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

    <div v-if="loading" class="text-center py-4">
      加载中...
    </div>
    
    <div v-if="error" class="text-red-500 text-center py-4">
      {{ error }}
    </div>

    <button 
      @click="showUploadForm = true"
      class="neumorphic fixed right-8 top-8 p-4 rounded-full hover:scale-105 transition-transform"
    >
      <span class="text-2xl">+</span>
    </button>

    <div class="neumorphic p-4 mb-8 rounded-lg">
      <div class="flex gap-4">
        <input 
          type="text" 
          placeholder="搜索..." 
          class="glass p-2 rounded-lg flex-1"
        >
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="DoneWork in DoneWorks" 
        :key="DoneWork.id"
        class="neumorphic rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
      >
        <img :src="DoneWork.coverImage" :alt="DoneWork.name" class="w-full h-48 object-cover">
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl">{{ DoneWork.name }}</h3>
            <span 
              class="text-sm px-2 py-1 rounded-full"
              :class="priorityColors[DoneWork.cpriority as keyof typeof priorityColors]"
            >
              {{ priorityLabels[DoneWork.cpriority as keyof typeof priorityLabels] }}
            </span>
          </div>
          <div class="flex gap-2 mb-2">
            <span class="glass px-2 py-1 rounded-full text-sm">{{ DoneWork.type }}</span>
            <span class="glass px-2 py-1 rounded-full text-sm">权重: {{ DoneWork.cweight }}</span>
          </div>
          <p v-if="DoneWork.description" class="mt-2 text-sm opacity-75">{{ DoneWork.description }}</p>
          <div class="mt-2 text-xs text-brand-blue/60 dark:text-white/60">
            更新时间: {{ new Date(DoneWork.updateTime).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>

    <div 
      v-if="showUploadForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showUploadForm = false"
    >
      <form 
        @submit.prevent="addDoneWork"
        class="neumorphic p-6 rounded-lg w-full max-w-md"
      >
        <h2 class="text-2xl mb-6 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">添加新作品</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block mb-1">作品名称</label>
            <input 
              v-model="newDoneWork.name"
              type="text"
              required
              class="glass w-full p-2 rounded-lg"
            >
          </div>

          <div>
            <label class="block mb-1">类型</label>
            <select 
              v-model="newDoneWork.type"
              class="glass w-full p-2 rounded-lg"
            >
              <option value="notes">笔记</option>
              <option value="assignment">作业</option>
              <option value="DoneWork">项目</option>
              <option value="research">研究</option>
            </select>
          </div>

          <div>
            <label class="block mb-1">优先级</label>
            <div class="flex gap-2">
              <label 
                v-for="n in 5" 
                :key="n"
                class="flex-1 cursor-pointer"
              >
                <input 
                  type="radio" 
                  :value="n"
                  v-model="newDoneWork.cpriority"
                  class="sr-only"
                >
                <div 
                  class="text-center p-2 rounded-lg transition-all"
                  :class="[
                    newDoneWork.cpriority === n 
                      ? priorityColors[n as keyof typeof priorityColors] 
                      : 'glass hover:bg-brand-orange/10'
                  ]"
                >
                  {{ n }}
                </div>
              </label>
            </div>
            <div class="text-sm text-center mt-1 text-brand-blue/60 dark:text-white/60">
              {{ priorityLabels[newDoneWork.cpriority as keyof typeof priorityLabels] }}
            </div>
          </div>

          <div>
            <label class="block mb-1">权重</label>
            <input 
              v-model="newDoneWork.cweight"
              type="number"
              min="0"
              required
              class="glass w-full p-2 rounded-lg"
            >
          </div>

          <div>
            <label class="block mb-1">描述</label>
            <textarea 
              v-model="newDoneWork.description"
              rows="3"
              class="glass w-full p-2 rounded-lg"
            ></textarea>
          </div>

          <div>
            <label class="block mb-1">封面图片</label>
            <input 
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="glass w-full p-2 rounded-lg"
            >
            <div v-if="newDoneWork.coverImage" class="mt-2">
              <img 
                :src="newDoneWork.coverImage" 
                alt="预览" 
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
            添加作品
          </button>
          <button 
            type="button"
            @click="showUploadForm = false"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>