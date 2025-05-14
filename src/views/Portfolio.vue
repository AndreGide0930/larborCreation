<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request, multipartPost } from '../utils/request'
import { useAuthStore } from '../stores/auth'

interface Work {
  pkCreation?: number
  cName: string
  cWeight: number
  cPriority: number
  cSynopsis?: string
  cUrl?: string
  fkUserInfo?: any
}

const works = ref<Work[]>([])
const showUploadForm = ref(false)
const newWork = ref<Work>({
  cName: '',
  cWeight: 0,
  cPriority: 3,
  cSynopsis: ''
})
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const authStore = useAuthStore()

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

const resetForm = () => {
  newWork.value = {
    cName: '',
    cWeight: 0,
    cPriority: 3,
    cSynopsis: ''
  }
  selectedFile.value = null
}

const fetchWorks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await request('/api/readAllWorksById', {
      params: {
        pkUserInfo: userInfo.value.pkUserInfo
      }
    })
    works.value = data
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
      if (error.value.includes('未登录')) {
        return
      }
    } else {
      error.value = '加载失败，请稍后重试'
    }
    console.error('Error fetching works:', err)
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 添加类型校验
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  if (!validTypes.includes(file.type)) {
    error.value = '仅支持JPEG/PNG/PDF/MP4/DOCX/XLSX格式'
    return
  }

  // 检查文件大小（100MB限制）
  if (file.size > 100 * 1024 * 1024) {
    error.value = '文件大小不能超过100MB'
    return
  }

  selectedFile.value = file
  newWork.value.cWeight = Number((file.size / (1024 * 1024)).toFixed(2))
  newWork.value.cName = file.name
}

const uploadWork = async () => {
  if (!selectedFile.value) {
    error.value = '请选择要上传的文件'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    // 创建 input 对象，完全匹配成功案例的格式
    const inputData = {
      cName: newWork.value.cName,
      fkUserInfo: {
        pkUserInfo: Number(userInfo.value.pkUserInfo)
      },
      cWeight: newWork.value.cWeight,
      cPriority: newWork.value.cPriority,
      cSynopsis: newWork.value.cSynopsis || ''
    }
    
    // 将 input 对象作为字符串添加到 FormData
    formData.append('input', JSON.stringify(inputData))

    console.log('Uploading file:', selectedFile.value.name)
    console.log('Input data:', inputData)

    const response = await multipartPost('/api/worksUpload', formData)

    if (response) {
      await fetchWorks()
      showUploadForm.value = false
      resetForm()
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    loading.value = false
  }
}

const previewWork = (work: Work) => {
  if (work.pkCreation) {
    window.open(`/api/preview?pkCreation=${work.pkCreation}`, '_blank')
  }
}

onMounted(() => {
  fetchWorks()
  resetForm() // 初始化表单状态
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        我的作品集
      </h1>
      
      <div class="text-sm text-brand-blue/60 dark:text-white/60">
        {{ userInfo.username || userInfo.email }}
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
        v-for="work in works" 
        :key="work.pkCreation"
        class="neumorphic rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
        @click="previewWork(work)"
      >
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl">{{ work.cName }}</h3>
            <span 
              class="text-sm px-2 py-1 rounded-full"
              :class="priorityColors[work.cPriority as keyof typeof priorityColors]"
            >
              {{ priorityLabels[work.cPriority as keyof typeof priorityLabels] }}
            </span>
          </div>
          <div class="flex gap-2 mb-2">
            <span class="glass px-2 py-1 rounded-full text-sm">大小: {{ work.cWeight }}MB</span>
          </div>
          <p v-if="work.cSynopsis" class="mt-2 text-sm opacity-75">{{ work.cSynopsis }}</p>
        </div>
      </div>
    </div>

    <div 
      v-if="showUploadForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showUploadForm = false"
    >
      <form 
        @submit.prevent="uploadWork"
        class="neumorphic p-6 rounded-lg w-full max-w-md"
      >
        <h2 class="text-2xl mb-6 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">上传新作品</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block mb-1">作品名称</label>
            <input 
              v-model="newWork.cName"
              type="text"
              required
              class="glass w-full p-2 rounded-lg"
            >
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
                  v-model="newWork.cPriority"
                  class="sr-only"
                >
                <div 
                  class="text-center p-2 rounded-lg transition-all"
                  :class="[
                    newWork.cPriority === n 
                      ? priorityColors[n as keyof typeof priorityColors] 
                      : 'glass hover:bg-brand-orange/10'
                  ]"
                >
                  {{ n }}
                </div>
              </label>
            </div>
            <div class="text-sm text-center mt-1 text-brand-blue/60 dark:text-white/60">
              {{ priorityLabels[newWork.cPriority as keyof typeof priorityLabels] }}
            </div>
          </div>

          <div>
            <label class="block mb-1">文件</label>
            <input 
              type="file"
              @change="handleFileSelect"
              required
              class="glass w-full p-2 rounded-lg"
              accept=".jpg,.jpeg,.png,.pdf,.mp4,.docx,.xlsx"
            >
            <div v-if="selectedFile" class="mt-2 text-sm text-brand-blue/60 dark:text-white/60">
              已选择: {{ selectedFile.name }} ({{ newWork.cWeight }}MB)
            </div>
          </div>

          <div>
            <label class="block mb-1">描述</label>
            <textarea 
              v-model="newWork.cSynopsis"
              rows="3"
              class="glass w-full p-2 rounded-lg"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button 
            type="submit"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors flex-1"
            :disabled="loading || !selectedFile"
          >
            {{ loading ? '上传中...' : '上传作品' }}
          </button>
          <button 
            type="button"
            @click="showUploadForm = false"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            :disabled="loading"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>