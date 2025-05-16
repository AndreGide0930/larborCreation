<script setup lang="ts">
import { useTimerStore } from '../stores/timer'
import { onMounted, watch } from 'vue'

const timerStore = useTimerStore()

onMounted(() => {
  const savedTask = localStorage.getItem('activeTask')
  if (savedTask) {
    timerStore.activeTask = JSON.parse(savedTask)
  }
  console.log('TaskPanel mounted, active task:', timerStore.activeTask)
})

watch(() => timerStore.activeTask, (newTask) => {
  console.log('Active task changed:', newTask)
}, { immediate: true })
</script>

<template>
  <div class="neumorphic p-6 rounded-lg max-w-xl w-full">
    <h2 class="text-2xl mb-4">当前任务</h2>
    
    <div v-if="timerStore.activeTask" class="space-y-6">
      <div class="glass px-4 py-3 rounded-xl">
        <h3 class="text-lg font-semibold mb-2">{{ timerStore.activeTask.title }}</h3>
        <p v-if="timerStore.activeTask.description" class="text-sm opacity-75">
          {{ timerStore.activeTask.description }}
        </p>
        <div class="flex items-center gap-4 mt-2 text-sm">
          <span v-if="timerStore.activeTask.priority" class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
            优先级: {{ timerStore.activeTask.priority }}
          </span>
          <span v-if="timerStore.activeTask.type" class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
            类型: {{ timerStore.activeTask.type }}
          </span>
        </div>
      </div>

      <div class="glass p-4 rounded-xl">
        <div class="flex items-center justify-between mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              :checked="timerStore.activeTask.completed"
              @change="timerStore.toggleTaskCompletion"
              class="w-5 h-5 rounded-lg accent-brand-orange"
            >
            <span>标记为已完成</span>
          </label>
        </div>

        <div>
          <label class="block text-left mb-2">笔记：</label>
          <textarea
            v-model="timerStore.activeTask.notes"
            @input="timerStore.updateTaskNotes(timerStore.activeTask.notes)"
            rows="3"
            class="glass w-full p-3 rounded-xl resize-none"
            placeholder="在这里添加笔记..."
          ></textarea>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-brand-blue/60 dark:text-white/60">
      暂无选中的任务
    </div>
  </div>
</template>