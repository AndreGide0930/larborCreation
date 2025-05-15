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
  createTime?: string
}

const works = ref<Work[]>([])
const showUploadForm = ref(false)
const showDeleteConfirm = ref(false)
const workToDelete = ref<Work | null>(null)
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

// const previewWork = (work: Work) => {
//   if (work.pkCreation) {
//     window.open(`/api/preview?pkCreation=${work.pkCreation}`, '_blank')
//   }
// }

// 添加新的预览状态
const previewUrl = ref('')
const showPreview = ref(false)
const previewPosition = ref({ x: 0, y: 0 })

const handleWorkHover = (work: Work, event: MouseEvent) => {
  if (work.pkCreation) {
    previewUrl.value = `/api/preview?pkCreation=${work.pkCreation}`
    showPreview.value = true
    // 计算预览框的位置，确保不会超出视口
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 默认显示在鼠标右侧
    let x = rect.right + 10
    let y = rect.top
    
    // 如果右侧空间不足，则显示在左侧
    if (x + 400 > viewportWidth) {
      x = rect.left - 410
    }
    
    // 如果底部空间不足，则向上偏移
    if (y + 300 > viewportHeight) {
      y = viewportHeight - 310
    }
    
    previewPosition.value = { x, y }
  }
}

const handleWorkLeave = () => {
  showPreview.value = false
}

const handleDelete = async (work: Work) => {
  workToDelete.value = work
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!workToDelete.value?.pkCreation) return
  
  loading.value = true
  error.value = ''
  
  try {
    await request(`/api/delete/${workToDelete.value.pkCreation}`, { // 使用路径参数
  method: 'DELETE'
})

    
    await fetchWorks()
    showDeleteConfirm.value = false
    workToDelete.value = null
  } catch (err) {
    console.error('Delete error:', err)
    error.value = err instanceof Error ? err.message : '删除失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWorks()
  resetForm()
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
        class="neumorphic rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group"
        @mouseenter="handleWorkHover(work, $event)"
        @mouseleave="handleWorkLeave"
      >
        <div class="p-4">
          <!-- 标题和优先级 -->
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-xl font-medium truncate max-w-[70%]">{{ work.cName }}</h3>
            <span 
              class="text-sm px-2 py-1 rounded-full whitespace-nowrap"
              :class="priorityColors[work.cPriority as keyof typeof priorityColors]"
            >
              {{ priorityLabels[work.cPriority as keyof typeof priorityLabels] }}
            </span>
          </div>

          <!-- 文件信息 -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="glass px-2 py-1 rounded-full text-sm">
              <i class="fas fa-weight-hanging mr-1"></i>
              {{ work.cWeight }}MB
            </span>
            <span class="glass px-2 py-1 rounded-full text-sm">
              <i class="fas fa-calendar-alt mr-1"></i>
              {{ new Date(work.createTime || '').toLocaleDateString() }}
            </span>
          </div>

          <!-- 描述 -->
          <div v-if="work.cSynopsis" class="mt-2">
            <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {{ work.cSynopsis }}
            </p>
          </div>

          <!-- 文件类型图标和删除按钮 -->
          <div class="absolute bottom-2 right-2 flex items-center gap-2">
            <button 
              v-if="work.pkCreation"
              @click.stop="handleDelete(work)"
              class="bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full shadow-md hover:shadow-lg"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
            <i 
              :class="{
                'fas fa-file-pdf text-red-500': work.cName?.toLowerCase().endsWith('.pdf'),
                'fas fa-file-image text-blue-500': work.cName && /\.(jpg|jpeg|png)$/i.test(work.cName),
                'fas fa-file-video text-purple-500': work.cName?.toLowerCase().endsWith('.mp4'),
                'fas fa-file-word text-blue-600': work.cName?.toLowerCase().endsWith('.docx'),
                'fas fa-file-excel text-green-600': work.cName?.toLowerCase().endsWith('.xlsx'),
                'fas fa-file text-gray-500': true
              }"
              class="text-xl"
            ></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览框 -->
    <div 
      v-if="showPreview"
      class="fixed z-50 bg-white rounded-lg shadow-xl overflow-hidden"
      :style="{
        left: `${previewPosition.x}px`,
        top: `${previewPosition.y}px`,
        width: '400px',
        height: '300px'
      }"
    >
      <iframe 
        :src="previewUrl" 
        class="w-full h-full border-0"
        @mouseenter="showPreview = true"
        @mouseleave="showPreview = false"
      ></iframe>
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

    <!-- 删除确认对话框 -->
    <div 
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
      @click.self="showDeleteConfirm = false"
    >
      <div class="neumorphic p-6 rounded-lg w-full max-w-md">
        <h2 class="text-2xl mb-6 text-red-500">确认删除</h2>
        <p class="mb-6">
          确定要删除作品 "{{ workToDelete?.cName }}" 吗？此操作不可恢复。
        </p>
        <div class="flex gap-4">
          <button 
            @click="confirmDelete"
            class="glass px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex-1"
            :disabled="loading"
          >
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
          <button 
            @click="showDeleteConfirm = false"
            class="glass px-6 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            :disabled="loading"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>