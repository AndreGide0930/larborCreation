<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

interface Task {
  pkCreation: number
  cName: string
  cType: string
  cPriority: number
  cSynopsis?: string
  cWeight: number
  cUrl?: string
  createTime: string
  updateTime?: string
}

interface Plan {
  pkPlan: number
  planDate: string
  planName: string
  fkUserInfoId: number
  timedoroes: Timedoro[]
}

interface Timedoro {
  pkTimedoro: number
  timeSlice: string
  creations: Task[]
  plans: Plan[]
  sumDone: number
  sumTodo: number
  fkUserInfo: number
}

const props = defineProps<{
  timedoroes: Timedoro[]
  onTimeBlockClick: (time: string) => void
  onTimeBlockEdit: (timedoro: Timedoro) => void
}>()

// Generate 48 time blocks for a day
const timeBlocks = computed(() => {
  const blocks = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = dayjs().startOf('day').add(hour, 'hour').add(minute, 'minute')
      const timeStr = time.format('HH:mm')
      
      // Find timedoro for this time block
      const timedoro = props.timedoroes?.find(t => 
        dayjs(t.timeSlice).format('HH:mm') === timeStr
      )
      
      blocks.push({
        time: timeStr,
        timedoro
      })
    }
  }
  return blocks
})
</script>

<template>
  <div class="grid grid-cols-6 gap-4 p-4">
    <div
      v-for="block in timeBlocks"
      :key="block.time"
      class="relative aspect-square rounded-xl transition-all duration-300 cursor-pointer"
      :class="[
        block.timedoro 
          ? 'glass shadow-lg hover:shadow-xl hover:scale-105' 
          : 'glass hover:bg-brand-orange/10'
      ]"
      @click="block.timedoro ? onTimeBlockEdit(block.timedoro) : onTimeBlockClick(block.time)"
    >
      <!-- Time -->
      <div class="absolute top-2 left-2 text-sm font-semibold">
        {{ block.time }}
      </div>

      <!-- Tasks -->
      <div v-if="block.timedoro" class="absolute inset-0 p-2 pt-8">
        <div class="h-full overflow-y-auto custom-scrollbar">
          <div 
            v-for="task in block.timedoro.creations" 
            :key="task.pkCreation"
            class="text-xs mb-1 truncate"
          >
            <span 
              class="inline-block w-2 h-2 rounded-full mr-1"
              :class="task.cType === 'DONE' ? 'bg-green-500' : 'bg-brand-orange'"
            ></span>
            {{ task.cName || '未命名任务' }}
          </div>
        </div>
        
        <!-- Stats -->
        <div class="absolute bottom-2 right-2 flex gap-1 text-xs">
          <span class="bg-white/20 px-1 rounded">
            完成: {{ block.timedoro.sumDone }}
          </span>
          <span class="bg-white/20 px-1 rounded">
            待办: {{ block.timedoro.sumTodo }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.brand.orange') transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  @apply w-1;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-brand-orange/50 rounded-full hover:bg-brand-orange/70 transition-colors;
}
</style>