<script setup lang="ts">
import { useTimerStore } from '../stores/timer'

const timerStore = useTimerStore()
</script>

<template>
  <div class="neumorphic p-6 rounded-lg max-w-xl w-full">
    <h2 class="text-2xl mb-4">当前任务</h2>
    
    <div v-if="timerStore.activeTask" class="space-y-6">
      <div class="glass px-4 py-3 rounded-xl text-lg">
        {{ timerStore.activeTask.title }}
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