<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { request, multipartPost } from '../utils/request'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { debounce } from 'lodash-es'

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
const searchKeyword = ref('')
const searchResults = ref<Work[]>([])
const isSearching = ref(false)
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
const i18n = useI18n()

// Preview state
const previewUrl = ref('')
const showPreview = ref(false)
const previewPosition = ref({ x: 0, y: 0 })
const currentPreviewWork = ref<Work | null>(null)
const previewLoading = ref(false)
let previewTimer: number | null = null
const isHovering = ref(false)

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

// Optimized position calculation with requestAnimationFrame
const updatePreviewPosition = (event: MouseEvent) => {
  requestAnimationFrame(() => {
    const margin = 20 // Margin from mouse pointer
    const previewWidth = 400
    const previewHeight = 300
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Calculate initial position (prefer right side)
    let x = event.clientX + margin
    let y = event.clientY - previewHeight / 2
    
    // Adjust if preview would go off screen
    if (x + previewWidth > viewportWidth) {
      x = event.clientX - previewWidth - margin // Show on left side
    }
    
    // Adjust vertical position if needed
    if (y < margin) {
      y = margin
    } else if (y + previewHeight > viewportHeight - margin) {
      y = viewportHeight - previewHeight - margin
    }
    
    previewPosition.value = { x, y }
  })
}

// Debounced mouse move handler
const handleWorkMove = debounce((event: MouseEvent) => {
  if (isHovering.value && currentPreviewWork.value) {
    updatePreviewPosition(event)
  }
}, 16) // ~60fps

const handleWorkHover = (work: Work, event: MouseEvent) => {
  if (!work.pkCreation) return
  
  // If hovering over the same work, just update position
  if (currentPreviewWork.value?.pkCreation === work.pkCreation) {
    updatePreviewPosition(event)
    return
  }

  // Clear existing timer
  if (previewTimer) {
    clearTimeout(previewTimer)
  }

  // Update state
  currentPreviewWork.value = work
  showPreview.value = true
  isHovering.value = true
  previewLoading.value = true
  previewUrl.value = ''

  // Set new preview URL with delay
  previewTimer = window.setTimeout(() => {
    if (isHovering.value && currentPreviewWork.value?.pkCreation === work.pkCreation) {
      previewUrl.value = `/api/preview?pkCreation=${work.pkCreation}`
      setTimeout(() => {
        if (isHovering.value && currentPreviewWork.value?.pkCreation === work.pkCreation) {
          previewLoading.value = false
        }
      }, 100)
    }
  }, 300)
}

const handleWorkLeave = () => {
  isHovering.value = false
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = null
  }
  showPreview.value = false
  currentPreviewWork.value = null
  previewUrl.value = ''
  previewLoading.value = false
}

// Rest of the component code remains unchanged...
</script>

<template>
<!-- Template code remains unchanged -->
</template>

<style scoped>
.glass {
  @apply bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm;
}

.neumorphic {
  @apply bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl shadow-lg;
}
</style>