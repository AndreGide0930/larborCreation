<script setup lang="ts">
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useTimerStore } from '../stores/timer'
import axios from 'axios'

// Task data structure
interface Task {
  id: number
  title: string
  urgent: boolean
  important: boolean
  dueDate: string
  completed: boolean
  priority: number
}

interface TodoItem {
  pkCreation: number
  createTime: string
  updateTime: string | null
  cname: string
  csynopsis: string | null
  cpriority: number
  ctype: string
  curl: string
  cweight: number
}

const timerStore = useTimerStore()

// Task lists for each quadrant
const urgentImportant = ref<Task[]>([])
const importantNotUrgent = ref<Task[]>([])
const urgentNotImportant = ref<Task[]>([])
const notUrgentNotImportant = ref<Task[]>([])

// New task form
const showNewTaskForm = ref(false)
const newTask = ref<Task>({
  id: 0,
  title: '',
  urgent: false,
  important: false,
  dueDate: new Date().toISOString().split('T')[0],
  completed: false,
  priority: 3
})

const fetchTodos = async () => {
  try {
    const response = await axios.get('/api/readAllWork')
    const todos: TodoItem[] = response.data

    // Clear existing lists
    urgentImportant.value = []
    importantNotUrgent.value = []
    urgentNotImportant.value = []
    notUrgentNotImportant.value = []

    // Sort todos into quadrants based on priority
    todos.forEach(todo => {
      const task: Task = {
        id: todo.pkCreation,
        title: todo.cname || '未命名任务',
        urgent: todo.cpriority >= 4,
        important: todo.cpriority >= 4,
        dueDate: new Date(todo.createTime).toISOString().split('T')[0],
        completed: false,
        priority: todo.cpriority
      }

      // Distribute tasks based on priority
      switch (todo.cpriority) {
        case 5:
          urgentImportant.value.push(task)
          break
        case 4:
          importantNotUrgent.value.push(task)
          break
        case 2:
        case 3:
          urgentNotImportant.value.push(task)
          break
        case 1:
          notUrgentNotImportant.value.push(task)
          break
      }
    })
  } catch (error) {
    console.error('获取待办事项失败:', error)
  }
}

onMounted(() => {
  fetchTodos()
})

const addTask = () => {
  const taskToAdd = {
    ...newTask.value,
    id: Date.now()
  }
  
  // Add task to appropriate quadrant based on priority
  if (taskToAdd.priority === 5) {
    urgentImportant.value.push(taskToAdd)
  } else if (taskToAdd.priority === 4) {
    importantNotUrgent.value.push(taskToAdd)
  } else if (taskToAdd.priority === 2 || taskToAdd.priority === 3) {
    urgentNotImportant.value.push(taskToAdd)
  } else {
    notUrgentNotImportant.value.push(taskToAdd)
  }
  
  // Reset form
  newTask.value = {
    id: 0,
    title: '',
    urgent: false,
    important: false,
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    priority: 3
  }
  showNewTaskForm.value = false
}

const toggleTaskComplete = (task: Task) => {
  task.completed = !task.completed
}

const startFocusMode = (task: Task) => {
  timerStore.startTimer({
    id: task.id,
    title: task.title
  })
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-12">
      <div>
        <h1 class="text-4xl mb-2 bg-gradient-to-r from-brand-orange to-brand-mint bg-clip-text text-transparent">任务管理</h1>
        <p class="text-brand-blue/60 dark:text-white/60">使用四象限法则管理你的任务</p>
      </div>
      <button 
        @click="showNewTaskForm = true"
        class="glass px-6 py-3 rounded-full hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
      >
        <span class="text-2xl">+</span>
        <span>添加任务</span>
      </button>
    </div>

    <!-- Matrix Container -->
    <div class="relative neumorphic p-8 rounded-2xl">
      <!-- Matrix Grid -->
      <div class="grid grid-cols-2 gap-8 relative">
        <!-- Matrix Dividers -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent"></div>
          <div class="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent"></div>
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-lg font-semibold text-brand-orange/80">
            紧急程度
          </div>
          <div class="absolute -right-4 top-1/2 -translate-y-1/2 transform rotate-90 text-lg font-semibold text-brand-orange/80">
            重要程度
          </div>
        </div>

        <!-- Important & Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-red-500">立即处理</h2>
            <div class="bg-red-500/10 px-3 py-1 rounded-full text-sm text-red-500 font-semibold w-fit">
              重要且紧急
            </div>
          </div>
          <draggable 
            v-model="urgentImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div 
                class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200"
                :class="{ 'opacity-50': task.completed }"
              >
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    :checked="task.completed"
                    @change="() => toggleTaskComplete(task)"
                    class="w-5 h-5 rounded-lg accent-red-500"
                  >
                  <div class="flex-1">
                    <h3 class="font-semibold" :class="{ 'line-through': task.completed }">
                      {{ task.title }}
                    </h3>
                    <p class="text-sm opacity-75 mt-1">截止日期: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="开始专注"
                  >
                    专注
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Important & Not Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-yellow-500">计划处理</h2>
            <div class="bg-yellow-500/10 px-3 py-1 rounded-full text-sm text-yellow-500 font-semibold w-fit">
              重要不紧急
            </div>
          </div>
          <draggable 
            v-model="importantNotUrgent"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div 
                class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200"
                :class="{ 'opacity-50': task.completed }"
              >
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    :checked="task.completed"
                    @change="() => toggleTaskComplete(task)"
                    class="w-5 h-5 rounded-lg accent-yellow-500"
                  >
                  <div class="flex-1">
                    <h3 class="font-semibold" :class="{ 'line-through': task.completed }">
                      {{ task.title }}
                    </h3>
                    <p class="text-sm opacity-75 mt-1">截止日期: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="开始专注"
                  >
                    专注
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Not Important & Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-blue-500">委托处理</h2>
            <div class="bg-blue-500/10 px-3 py-1 rounded-full text-sm text-blue-500 font-semibold w-fit">
              不重要但紧急
            </div>
          </div>
          <draggable 
            v-model="urgentNotImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div 
                class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200"
                :class="{ 'opacity-50': task.completed }"
              >
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    :checked="task.completed"
                    @change="() => toggleTaskComplete(task)"
                    class="w-5 h-5 rounded-lg accent-blue-500"
                  >
                  <div class="flex-1">
                    <h3 class="font-semibold" :class="{ 'line-through': task.completed }">
                      {{ task.title }}
                    </h3>
                    <p class="text-sm opacity-75 mt-1">截止日期: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="开始专注"
                  >
                    专注
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Not Important & Not Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-gray-500">考虑删除</h2>
            <div class="bg-gray-500/10 px-3 py-1 rounded-full text-sm text-gray-500 font-semibold w-fit">
              不重要不紧急
            </div>
          </div>
          <draggable 
            v-model="notUrgentNotImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div 
                class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200"
                :class="{ 'opacity-50': task.completed }"
              >
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    :checked="task.completed"
                    @change="() => toggleTaskComplete(task)"
                    class="w-5 h-5 rounded-lg accent-gray-500"
                  >
                  <div class="flex-1">
                    <h3 class="font-semibold" :class="{ 'line-through': task.completed }">
                      {{ task.title }}
                    </h3>
                    <p class="text-sm opacity-75 mt-1">截止日期: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="开始专注"
                  >
                    专注
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- New Task Form Modal -->
    <div 
      v-if="showNewTaskForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
      @click.self="showNewTaskForm = false"
    >
      <form 
        @submit.prevent="addTask"
        class="neumorphic p-8 rounded-2xl w-full max-w-md"
      >
        <h2 class="text-2xl font-bold mb-6">添加新任务</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block mb-2 font-semibold">标题</label>
            <input 
              v-model="newTask.title"
              type="text"
              required
              class="glass w-full p-3 rounded-xl"
              placeholder="输入任务标题"
            >
          </div>

          <div>
            <label class="block mb-2 font-semibold">截止日期</label>
            <input 
              v-model="newTask.dueDate"
              type="date"
              required
              class="glass w-full p-3 rounded-xl"
            >
          </div>

          <div>
            <label class="block mb-2 font-semibold">优先级</label>
            <select 
              v-model="newTask.priority"
              class="glass w-full p-3 rounded-xl"
            >
              <option value="5">最高优先级（重要且紧急）</option>
              <option value="4">高优先级（重要不紧急）</option>
              <option value="3">中等优先级（不重要但紧急）</option>
              <option value="2">低优先级（不重要但紧急）</option>
              <option value="1">最低优先级（不重要不紧急）</option>
            </select>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button 
            type="submit"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors flex-1 font-semibold"
          >
            添加任务
          </button>
          <button 
            type="button"
            @click="showNewTaskForm = false"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>