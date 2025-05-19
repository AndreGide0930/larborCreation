<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { request } from '../utils/request'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface KanbanData {
  _1: number
  _2: string
}

const props = defineProps<{
  pkUserInfo: string
}>()

const chartData = ref({
  labels: [] as string[],
  datasets: [{
    label: '学习效果',
    data: [] as number[],
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.5)',
    tension: 0.4
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: '学习效果趋势'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '学习分数'
      }
    },
    x: {
      title: {
        display: true,
        text: '日期'
      }
    }
  }
}

const loading = ref(false)
const error = ref('')

const fetchData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const data = await request('/api/effectiveKanban', {
      params: {
        pkUserInfo: props.pkUserInfo
      }
    })

    if (Array.isArray(data)) {
      // Sort data by date
      const sortedData = [...data].sort((a, b) => 
        new Date(a._2).getTime() - new Date(b._2).getTime()
      )

      // Update chart data
      chartData.value = {
        labels: sortedData.map(item => item._2),
        datasets: [{
          label: '学习效果',
          data: sortedData.map(item => item._1),
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.5)',
          tension: 0.4
        }]
      }
    }
  } catch (e: any) {
    error.value = e.message || '获取数据失败'
  } finally {
    loading.value = false
  }
}

// Watch for pkUserInfo changes
watch(() => props.pkUserInfo, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="neumorphic p-6 rounded-2xl">
    <div v-if="loading" class="flex items-center justify-center h-[400px]">
      <div class="text-brand-orange">加载中...</div>
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center h-[400px]">
      <div class="text-red-500">{{ error }}</div>
    </div>
    
    <div v-else class="h-[400px]">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>