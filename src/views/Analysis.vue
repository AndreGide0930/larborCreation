<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { request } from '../utils/request'
import LearningChart from '../components/LearningChart.vue'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Plan {
  pkPlan: number
  planDate: string
  planName: string
}

interface Timedoro {
  pkTimedoro: number
  timeSlice: string
}

const plans = ref<Plan[]>([])
const timedoros = ref<Timedoro[]>([])
const selectedPlan = ref<number | null>(null)
const selectedTimedoro = ref<number | null>(null)
const analysisResult = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

// Get user info from localStorage
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// Chart data
const chartData = ref({
  labels: [] as string[],
  datasets: [{
    label: '学习效果趋势',
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
      text: '学习效果趋势分析'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '学习效果得分'
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

// 获取所有计划
const fetchPlans = async () => {
  try {
    loading.value = true
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const response = await request('/api/readPlanById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    plans.value = response
    
    // 更新图表数据
    updateChartData(response)
  } catch (e: any) {
    error.value = e.message || '获取计划列表失败'
  } finally {
    loading.value = false
  }
}

// 获取指定计划的时间块
const fetchTimedoros = async (pkPlan: number) => {
  try {
    loading.value = true
    const response = await request('/api/readTimedoroByPkPlan', {
      params: {
        pkPlan
      }
    })
    timedoros.value = response.map((item: any) => item._2)
  } catch (e: any) {
    error.value = e.message || '获取时间块列表失败'
  } finally {
    loading.value = false
  }
}

// 分析计划
const analyzePlan = async () => {
  if (!selectedPlan.value) return
  
  try {
    loading.value = true
    const response = await request('/api/analysisPlan', {
      params: {
        pkPlan: selectedPlan.value
      }
    })
    analysisResult.value = response
  } catch (e: any) {
    error.value = e.message || '分析计划失败'
  } finally {
    loading.value = false
  }
}

// 分析时间块
const analyzeTimedoro = async () => {
  if (!selectedTimedoro.value) return
  
  try {
    loading.value = true
    const response = await request(`/api/analysis/${selectedTimedoro.value}`)
    analysisResult.value = response
  } catch (e: any) {
    error.value = e.message || '分析时间块失败'
  } finally {
    loading.value = false
  }
}

// 更新图表数据
const updateChartData = async (planList: Plan[]) => {
  const sortedPlans = [...planList].sort((a, b) => 
    new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
  )
  
  const results = await Promise.all(
    sortedPlans.map(plan => 
      request('/api/analysisPlan', {
        params: {
          pkPlan: plan.pkPlan
        }
      })
    )
  )
  
  chartData.value.labels = sortedPlans.map(plan => plan.planDate)
  chartData.value.datasets[0].data = results
}

// 监听计划选择变化
const handlePlanChange = async (pkPlan: number) => {
  selectedPlan.value = pkPlan
  selectedTimedoro.value = null
  analysisResult.value = null
  await fetchTimedoros(pkPlan)
}

// 监听时间块选择变化
const handleTimedoroChange = (pkTimedoro: number) => {
  selectedTimedoro.value = pkTimedoro
  analysisResult.value = null
}

// 格式化分析结果
const formattedResult = computed(() => {
  if (analysisResult.value === null) return '未分析'
  return `${analysisResult.value} 分`
})

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
        学习效果分析
      </h1>
      <p class="text-brand-blue/60 dark:text-white/60">
        深入了解你的学习表现
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 分析面板 -->
      <div class="neumorphic p-6 rounded-2xl">
        <h2 class="text-2xl font-bold mb-6">效果分析</h2>
        
        <div class="space-y-6">
          <!-- 计划选择 -->
          <div>
            <label class="block text-sm font-medium mb-2">选择计划</label>
            <select
              v-model="selectedPlan"
              @change="handlePlanChange($event.target.value)"
              class="glass w-full p-3 rounded-xl"
            >
              <option value="">请选择计划</option>
              <option
                v-for="plan in plans"
                :key="plan.pkPlan"
                :value="plan.pkPlan"
              >
                {{ plan.planName }} ({{ plan.planDate }})
              </option>
            </select>
          </div>

          <!-- 时间块选择 -->
          <div>
            <label class="block text-sm font-medium mb-2">选择时间块</label>
            <select
              v-model="selectedTimedoro"
              @change="handleTimedoroChange($event.target.value)"
              class="glass w-full p-3 rounded-xl"
              :disabled="!selectedPlan"
            >
              <option value="">请选择时间块</option>
              <option
                v-for="timedoro in timedoros"
                :key="timedoro.pkTimedoro"
                :value="timedoro.pkTimedoro"
              >
                {{ new Date(timedoro.timeSlice).toLocaleTimeString() }}
              </option>
            </select>
          </div>

          <!-- 分析按钮 -->
          <div class="flex gap-4">
            <button
              @click="analyzePlan"
              :disabled="!selectedPlan || loading"
              class="flex-1 glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              分析计划
            </button>
            <button
              @click="analyzeTimedoro"
              :disabled="!selectedTimedoro || loading"
              class="flex-1 glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
            >
              分析时间块
            </button>
          </div>

          <!-- 分析结果 -->
          <div v-if="analysisResult !== null" class="glass p-6 rounded-xl text-center">
            <h3 class="text-xl mb-2">分析结果</h3>
            <div class="text-4xl font-bold bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">
              {{ formattedResult }}
            </div>
          </div>

          <!-- 错误提示 -->
          <p v-if="error" class="text-red-500 text-center">{{ error }}</p>
        </div>
      </div>

      <!-- 趋势图表 -->
      <LearningChart :pk-user-info="String(userInfo.pkUserInfo)" />
    </div>
  </div>
</template>