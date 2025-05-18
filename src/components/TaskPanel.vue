<script setup lang="ts">
import { useTimerStore } from '../stores/timer'
import { onMounted, watch, ref } from 'vue'
import { request, multipartPost } from '../utils/request'

const timerStore = useTimerStore()
const selectedFile = ref<File | null>(null)
const uploadLoading = ref(false)
const uploadError = ref('')

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 添加类型校验
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  if (!validTypes.includes(file.type)) {
    uploadError.value = '仅支持JPEG/PNG/PDF/MP4/DOCX/XLSX格式'
    return
  }

  // 检查文件大小（100MB限制）
  if (file.size > 100 * 1024 * 1024) {
    uploadError.value = '文件大小不能超过100MB'
    return
  }

  selectedFile.value = file
  uploadError.value = ''
}

const uploadWork = async (task: any) => {
  if (!selectedFile.value) {
    uploadError.value = '请选择要上传的文件'
    return
  }

  uploadLoading.value = true
  uploadError.value = ''

  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    // 创建 input 对象
    const inputData = {
      cName: selectedFile.value.name,
      fkUserInfo: {
        pkUserInfo: Number(userInfo.pkUserInfo)
      },
      cWeight: Number((selectedFile.value.size / (1024 * 1024)).toFixed(2)),
      cPriority: task.priority || 3,
      cSynopsis: task.notes || ''
    }
    
    formData.append('input', JSON.stringify(inputData))

    await multipartPost('/api/worksUpload', formData)
    selectedFile.value = null;
    uploadError.value = ''
    
    // 重置文件输入框
    const fileInput = document.getElementById(`file-input-${task.id}`) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  } catch (err) {
    console.error('Upload error:', err)
    uploadError.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    uploadLoading.value = false
  }
}

onMounted(() => {
  const savedTasks = localStorage.getItem('activeTasks')
  if (savedTasks) {
    timerStore.activeTasks = JSON.parse(savedTasks)
  }
  console.log('TaskPanel mounted, active tasks:', timerStore.activeTasks)
})

watch(() => timerStore.activeTasks, (newTasks) => {
  console.log('Active tasks changed:', newTasks)
}, { immediate: true })
</script>

<template>
  <div class="neumorphic p-6 rounded-lg max-w-xl w-full">
    <h2 class="text-2xl mb-4">当前任务</h2>
    
    <div v-if="timerStore.activeTasks.length > 0" class="space-y-4">
      <div 
        v-for="task in timerStore.activeTasks" 
        :key="task.id"
        class="glass px-4 py-3 rounded-xl"
      >
        <h3 class="text-lg font-semibold mb-2">{{ task.title }}</h3>
        <p v-if="task.description" class="text-sm opacity-75">
          {{ task.description }}
        </p>
        <div class="flex items-center gap-4 mt-2 text-sm">
          <span v-if="task.priority" class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
            优先级: {{ task.priority }}
          </span>
          <span v-if="task.type" class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
            类型: {{ task.type }}
          </span>
        </div>
        <div class="flex items-center justify-between mt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              :checked="task.completed"
              @change="timerStore.toggleTaskCompletion(task.id)"
              class="w-5 h-5 rounded-lg accent-brand-orange"
            >
            <span :class="{ 'line-through text-gray-500': task.completed }">
              {{ task.completed ? '已完成' : '现已完成' }}
            </span>
          </label>
          <span 
            class="text-sm px-2 py-1 rounded"
            :class="task.completed ? 'bg-green-500/10 text-green-500' : 'bg-brand-orange/10 text-brand-orange'"
          >
            {{ task.completed ? 'DONE' : 'TODO' }}
          </span>
        </div>
        
        <!-- 添加笔记区域 -->
        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">笔记：</label>
          <textarea
            :value="task.notes"
            @input="(e) => timerStore.updateTaskNotes(task.id, (e.target as HTMLTextAreaElement).value)"
            rows="3"
            class="glass w-full p-3 rounded-xl resize-none text-sm"
            placeholder="在这里添加笔记..."
          ></textarea>
        </div>

        <!-- 添加文件上传区域 -->
        <div v-if="task.completed" class="mt-4 space-y-2">
          <div class="flex items-center gap-4">
            <input 
              :id="'file-input-' + task.id"
              type="file"
              @change="handleFileSelect"
              class="glass flex-1 p-2 rounded-lg text-sm"
              accept=".jpg,.jpeg,.png,.pdf,.mp4,.docx,.xlsx"
            >
            <button 
              @click="uploadWork(task)"
              :disabled="uploadLoading || !selectedFile"
              class="glass px-4 py-2 rounded-lg hover:bg-brand-orange/10 transition-colors"
            >
              {{ uploadLoading ? '上传中...' : '上传作品' }}
            </button>
          </div>
          <p v-if="uploadError" class="text-red-500 text-sm">{{ uploadError }}</p>
          <p v-if="selectedFile" class="text-sm text-brand-blue/60">
            已选择: {{ selectedFile.name }} ({{ (selectedFile.size / (1024 * 1024)).toFixed(2) }}MB)
          </p>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500">
      没有正在进行的任务
    </div>
  </div>
</template>