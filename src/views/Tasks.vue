<script setup lang="ts">
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useTimerStore } from '../stores/timer'
import axios from 'axios'
import { get } from '../utils/request'

interface TodoItem {
  pkCreation: number
  createTime: string
  updateTime: string | null
  cname: string
  csynopsis: string | null
  cpriority: number // 优先级: 5-紧急且重要, 4-重要但不紧急, 3/2-紧急但不重要, 1-不紧急也不重要
  ctype: string
  curl: string
  cweight: number
}


const timerStore = useTimerStore()

// Task lists for each quadrant
const urgentImportant = ref<TodoItem[]>([])
const importantNotUrgent = ref<TodoItem[]>([])
const urgentNotImportant = ref<TodoItem[]>([])
const notUrgentNotImportant = ref<TodoItem[]>([])

// New task form
const showNewTaskForm = ref(false)
const newTask = ref({
  cname: '',
  cpriority: 3,
  ctype: 'TODO',
  cweight: 0,
  csynopsis: ''
})

const fetchTodos = async () => {
  try {
    console.log('Fetching todos...')
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const todos: TodoItem[] = await get('/api/readAllWorkById', {
      params: {
        pkUserInfo: userInfo.pkUserInfo
      }
    })
    console.log('API Response:', todos)

    // 2️⃣ 不再用 response.data，直接判断 response 本身
    if (Array.isArray(todos)) {
      // 清空现有列表
      urgentImportant.value = []
      importantNotUrgent.value = []
      urgentNotImportant.value = []
      notUrgentNotImportant.value = []

      // 根据优先级将任务分配到不同象限
      todos.forEach(todo => {
        switch (todo.cpriority) {
          case 5:
            urgentImportant.value.push(todo)
            break
          case 4:
            importantNotUrgent.value.push(todo)
            break
          case 3:
          case 2:
            urgentNotImportant.value.push(todo)
            break
          case 1:
            notUrgentNotImportant.value.push(todo)
            break
        }
      })

      // 定义并应用按创建时间降序排序
      const sortByCreateTime = (a: TodoItem, b: TodoItem) =>
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()

      urgentImportant.value.sort(sortByCreateTime)
      importantNotUrgent.value.sort(sortByCreateTime)
      urgentNotImportant.value.sort(sortByCreateTime)
      notUrgentNotImportant.value.sort(sortByCreateTime)

    } else {
      console.error('获取待办事项失败：返回值不是数组', todos)
      // 失败时清空列表
      urgentImportant.value = []
      importantNotUrgent.value = []
      urgentNotImportant.value = []
      notUrgentNotImportant.value = []
    }

  } catch (error) {
    console.error('获取待办事项时发生错误:', error)
    // 错误时清空列表
    urgentImportant.value = []
    importantNotUrgent.value = []
    urgentNotImportant.value = []
    notUrgentNotImportant.value = []
  }
}


// 组件挂载后获取待办事项
onMounted(() => {
  console.log('Tasks component mounted')
  console.log('Current token:', localStorage.getItem('token'))
  fetchTodos()
})
const addTask = async () => {
  try {
    const cName = newTask.value.cname;
    const cType = newTask.value.ctype;
    const cPriority = Number(newTask.value.cpriority);

    let cWeight = null;
    // newTask.cweight can be 0 (default), a user-entered number, or null (if input is cleared)
    if (newTask.value.cweight !== null && String(newTask.value.cweight).trim() !== '') {
        cWeight = Number(newTask.value.cweight);
    }

    let cSynopsis = null;
    if (newTask.value.csynopsis && newTask.value.csynopsis.trim() !== '') {
        cSynopsis = newTask.value.csynopsis.trim();
    }

    const payload = {
      cName: cName,
      cType: cType,
      cPriority: cPriority,
      cWeight: cWeight,
      cSynopsis: cSynopsis
      // cUrl is not in the form, so it's not included in the payload.
      // The backend's @Nullable String cUrl() should handle its absence.
    };

    await axios.post('http://localhost:8080/createWork', payload);
    await fetchTodos(); // Refresh the task list

    // Reset form and hide modal
    newTask.value = {
      cname: '',
      cpriority: 3, // Default priority
      ctype: 'TODO', // Default type
      cweight: 0,   // Default weight
      csynopsis: ''
    };
    showNewTaskForm.value = false;

  } catch (error) {
    console.error('创建任务失败:', error);
    // Consider adding user-facing error notification here
  }
}

const startFocusMode = (task: TodoItem) => {
  timerStore.startTimer({
    id: task.pkCreation,
    title: task.cname
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
            item-key="pkCreation"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200">
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <h3 class="font-semibold">{{ task.cname }}</h3>
                    <div class="flex items-center gap-2 text-sm opacity-75 mt-1">
                      <span>创建时间: {{ new Date(task.createTime).toLocaleString() }}</span>
                      <span v-if="task.updateTime" class="text-brand-orange">
                        (已更新: {{ new Date(task.updateTime).toLocaleString() }})
                      </span>
                    </div>
                    <p v-if="task.csynopsis" class="text-sm opacity-75 mt-1">{{ task.csynopsis }}</p>
                    <div class="flex items-center gap-4 mt-2 text-sm">
                      <span class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
                        权重: {{ task.cweight }}
                      </span>
                      <span class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
                        类型: {{ task.ctype }}
                      </span>
                      <a 
                        v-if="task.curl" 
                        :href="task.curl" 
                        target="_blank"
                        class="text-brand-mint hover:underline"
                      >
                        相关链接
                      </a>
                    </div>
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
            item-key="pkCreation"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200">
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <h3 class="font-semibold">{{ task.cname }}</h3>
                    <div class="flex items-center gap-2 text-sm opacity-75 mt-1">
                      <span>创建时间: {{ new Date(task.createTime).toLocaleString() }}</span>
                      <span v-if="task.updateTime" class="text-brand-orange">
                        (已更新: {{ new Date(task.updateTime).toLocaleString() }})
                      </span>
                    </div>
                    <p v-if="task.csynopsis" class="text-sm opacity-75 mt-1">{{ task.csynopsis }}</p>
                    <div class="flex items-center gap-4 mt-2 text-sm">
                      <span class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
                        权重: {{ task.cweight }}
                      </span>
                      <span class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
                        类型: {{ task.ctype }}
                      </span>
                      <a 
                        v-if="task.curl" 
                        :href="task.curl" 
                        target="_blank"
                        class="text-brand-mint hover:underline"
                      >
                        相关链接
                      </a>
                    </div>
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
            item-key="pkCreation"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200">
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <h3 class="font-semibold">{{ task.cname }}</h3>
                    <div class="flex items-center gap-2 text-sm opacity-75 mt-1">
                      <span>创建时间: {{ new Date(task.createTime).toLocaleString() }}</span>
                      <span v-if="task.updateTime" class="text-brand-orange">
                        (已更新: {{ new Date(task.updateTime).toLocaleString() }})
                      </span>
                    </div>
                    <p v-if="task.csynopsis" class="text-sm opacity-75 mt-1">{{ task.csynopsis }}</p>
                    <div class="flex items-center gap-4 mt-2 text-sm">
                      <span class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
                        权重: {{ task.cweight }}
                      </span>
                      <span class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
                        类型: {{ task.ctype }}
                      </span>
                      <a 
                        v-if="task.curl" 
                        :href="task.curl" 
                        target="_blank"
                        class="text-brand-mint hover:underline"
                      >
                        相关链接
                      </a>
                    </div>
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
            item-key="pkCreation"
            class="space-y-4 min-h-[300px]"
          >
            <template #item="{ element: task }">
              <div class="glass p-4 rounded-xl cursor-move hover:shadow-lg hover:scale-102 transition-all duration-200">
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <h3 class="font-semibold">{{ task.cname }}</h3>
                    <div class="flex items-center gap-2 text-sm opacity-75 mt-1">
                      <span>创建时间: {{ new Date(task.createTime).toLocaleString() }}</span>
                      <span v-if="task.updateTime" class="text-brand-orange">
                        (已更新: {{ new Date(task.updateTime).toLocaleString() }})
                      </span>
                    </div>
                    <p v-if="task.csynopsis" class="text-sm opacity-75 mt-1">{{ task.csynopsis }}</p>
                    <div class="flex items-center gap-4 mt-2 text-sm">
                      <span class="bg-brand-orange/10 px-2 py-1 rounded text-brand-orange">
                        权重: {{ task.cweight }}
                      </span>
                      <span class="bg-brand-blue/10 px-2 py-1 rounded text-brand-blue">
                        类型: {{ task.ctype }}
                      </span>
                      <a 
                        v-if="task.curl" 
                        :href="task.curl" 
                        target="_blank"
                        class="text-brand-mint hover:underline"
                      >
                        相关链接
                      </a>
                    </div>
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
              v-model="newTask.cname"
              type="text"
              required
              class="glass w-full p-3 rounded-xl"
              placeholder="输入任务标题"
            >
          </div>

          <div>
            <label class="block mb-2 font-semibold">优先级</label>
            <select 
              v-model="newTask.cpriority"
              class="glass w-full p-3 rounded-xl"
            >
              <option value="5">最高优先级（重要且紧急）</option>
              <option value="4">高优先级（重要不紧急）</option>
              <option value="3">中等优先级（不重要但紧急）</option>
              <option value="2">低优先级（不重要但紧急）</option>
              <option value="1">最低优先级（不重要不紧急）</option>
            </select>
          </div>

          <div>
            <label class="block mb-2 font-semibold">描述</label>
            <textarea 
              v-model="newTask.csynopsis"
              rows="3"
              class="glass w-full p-3 rounded-xl"
              placeholder="任务描述（可选）"
            ></textarea>
          </div>

          <div>
            <label class="block mb-2 font-semibold">权重</label>
            <input 
              v-model="newTask.cweight"
              type="number"
              min="0"
              step="0.1"
              class="glass w-full p-3 rounded-xl"
              placeholder="任务权重"
            >
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