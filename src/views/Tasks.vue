<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'
import { useTimerStore } from '../stores/timer'

// Task data structure
interface Task {
  id: number
  title: string
  urgent: boolean
  important: boolean
  dueDate: string
  completed: boolean
}

const timerStore = useTimerStore()

// Task lists for each quadrant
const urgentImportant = ref<Task[]>([
  {
    id: 1,
    title: 'Complete Math Assignment',
    urgent: true,
    important: true,
    dueDate: '2024-02-25',
    completed: false
  }
])

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
  completed: false
})

const addTask = () => {
  const taskToAdd = {
    ...newTask.value,
    id: Date.now()
  }
  
  // Add task to appropriate quadrant
  if (taskToAdd.urgent && taskToAdd.important) {
    urgentImportant.value.push(taskToAdd)
  } else if (taskToAdd.important) {
    importantNotUrgent.value.push(taskToAdd)
  } else if (taskToAdd.urgent) {
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
    completed: false
  }
  showNewTaskForm.value = false
}

const toggleTaskComplete = (task: Task) => {
  task.completed = !task.completed
}

const updateTaskQuadrant = (task: Task, urgent: boolean, important: boolean) => {
  task.urgent = urgent
  task.important = important
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
        <h1 class="text-4xl mb-2">Task Manager</h1>
        <p class="text-brand-blue/60 dark:text-white/60">Organize your tasks using the Eisenhower Matrix</p>
      </div>
      <button 
        @click="showNewTaskForm = true"
        class="glass px-6 py-3 rounded-full hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
      >
        <span class="text-2xl">+</span>
        <span>Add Task</span>
      </button>
    </div>

    <!-- Matrix Container -->
    <div class="relative neumorphic p-8 rounded-2xl">
      <!-- Matrix Grid -->
      <div class="grid grid-cols-2 gap-8 relative">
        <!-- Matrix Dividers -->
        <div class="absolute inset-0 pointer-events-none">
          <!-- Vertical Divider -->
          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent"></div>
          <!-- Horizontal Divider -->
          <div class="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent"></div>
          <!-- Axis Labels -->
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-lg font-semibold text-brand-orange/80">
            Urgent
          </div>
          <div class="absolute -right-4 top-1/2 -translate-y-1/2 transform rotate-90 text-lg font-semibold text-brand-orange/80">
            Important
          </div>
        </div>

        <!-- Important & Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-red-500">Do First</h2>
            <div class="bg-red-500/10 px-3 py-1 rounded-full text-sm text-red-500 font-semibold w-fit">
              Important & Urgent
            </div>
          </div>
          <draggable 
            v-model="urgentImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
            @change="(e) => e.added && updateTaskQuadrant(e.added.element, true, true)"
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
                    <p class="text-sm opacity-75 mt-1">Due: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="Start Focus Mode"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Important & Not Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-yellow-500">Schedule</h2>
            <div class="bg-yellow-500/10 px-3 py-1 rounded-full text-sm text-yellow-500 font-semibold w-fit">
              Important & Not Urgent
            </div>
          </div>
          <draggable 
            v-model="importantNotUrgent"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
            @change="(e) => e.added && updateTaskQuadrant(e.added.element, false, true)"
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
                    <p class="text-sm opacity-75 mt-1">Due: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="Start Focus Mode"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Not Important & Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-blue-500">Delegate</h2>
            <div class="bg-blue-500/10 px-3 py-1 rounded-full text-sm text-blue-500 font-semibold w-fit">
              Not Important & Urgent
            </div>
          </div>
          <draggable 
            v-model="urgentNotImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
            @change="(e) => e.added && updateTaskQuadrant(e.added.element, true, false)"
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
                    <p class="text-sm opacity-75 mt-1">Due: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="Start Focus Mode"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Not Important & Not Urgent -->
        <div class="p-6 min-h-[400px] transition-all duration-300 rounded-2xl">
          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-3xl font-bold text-gray-500">Eliminate</h2>
            <div class="bg-gray-500/10 px-3 py-1 rounded-full text-sm text-gray-500 font-semibold w-fit">
              Not Important & Not Urgent
            </div>
          </div>
          <draggable 
            v-model="notUrgentNotImportant"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="space-y-4 min-h-[300px]"
            @change="(e) => e.added && updateTaskQuadrant(e.added.element, false, false)"
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
                    <p class="text-sm opacity-75 mt-1">Due: {{ task.dueDate }}</p>
                  </div>
                  <button 
                    @click="startFocusMode(task)"
                    class="glass px-3 py-1 rounded-lg text-sm text-brand-orange hover:bg-brand-orange/10 transition-colors"
                    title="Start Focus Mode"
                  >
                    Focus
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
        <h2 class="text-2xl font-bold mb-6">Add New Task</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block mb-2 font-semibold">Title</label>
            <input 
              v-model="newTask.title"
              type="text"
              required
              class="glass w-full p-3 rounded-xl"
              placeholder="Enter task title"
            >
          </div>

          <div>
            <label class="block mb-2 font-semibold">Due Date</label>
            <input 
              v-model="newTask.dueDate"
              type="date"
              required
              class="glass w-full p-3 rounded-xl"
            >
          </div>

          <div class="flex gap-6">
            <label class="flex items-center gap-2 p-3 glass rounded-xl cursor-pointer flex-1 hover:bg-brand-orange/10 transition-colors">
              <input 
                v-model="newTask.urgent"
                type="checkbox"
                class="w-5 h-5 rounded-lg accent-brand-orange"
              >
              <span>Urgent</span>
            </label>

            <label class="flex items-center gap-2 p-3 glass rounded-xl cursor-pointer flex-1 hover:bg-brand-orange/10 transition-colors">
              <input 
                v-model="newTask.important"
                type="checkbox"
                class="w-5 h-5 rounded-lg accent-brand-orange"
              >
              <span>Important</span>
            </label>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button 
            type="submit"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors flex-1 font-semibold"
          >
            Add Task
          </button>
          <button 
            type="button"
            @click="showNewTaskForm = false"
            class="glass px-6 py-3 rounded-xl hover:bg-brand-orange/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>