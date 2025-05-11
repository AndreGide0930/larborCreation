<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode()
const isOpen = ref(false)
const messages = ref<Message[]>([
  {
    id: 1,
    type: 'agent',
    content: '👋 你好！我是你的学习助手。有什么我可以帮你的吗？',
    timestamp: new Date()
  }
])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const isTyping = ref(false)

interface Message {
  id: number
  type: 'user' | 'agent'
  content: string
  timestamp: Date
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // Add user message
  messages.value.push({
    id: Date.now(),
    type: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  })

  const userMessage = inputMessage.value
  inputMessage.value = ''
  
  // Scroll to bottom after user message
  await nextTick()
  scrollToBottom()

  // Show typing indicator
  isTyping.value = true

  // Simulate agent response (replace with actual API call)
  setTimeout(() => {
    isTyping.value = false
    messages.value.push({
      id: Date.now(),
      type: 'agent',
      content: `I understand you're asking about "${userMessage}". Let me help you with that...`,
      timestamp: new Date()
    })
    
    // Scroll to bottom after agent response
    nextTick(() => {
      scrollToBottom()
    })
  }, 1500)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="fixed bottom-8 right-8 z-50">
    <!-- Chat Toggle Button -->
    <button
      @click="toggleChat"
      class="neumorphic w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-brand-orange to-brand-mint text-white shadow-lg hover:shadow-xl"
      :class="{ 'scale-95': isOpen }"
    >
      {{ isOpen ? '×' : '💬' }}
    </button>

    <!-- Chat Window -->
    <div
      v-show="isOpen"
      class="absolute bottom-20 right-0 w-96 neumorphic rounded-3xl overflow-hidden transform transition-all duration-300 bg-white/90 dark:bg-brand-blue/90 backdrop-blur-xl"
    >
      <!-- Header -->
      <div class="p-4 bg-gradient-to-r from-brand-orange to-brand-mint text-white">
        <h3 class="text-lg font-semibold">学习助手</h3>
        <p class="text-sm opacity-80">随时为你解答问题</p>
      </div>

      <!-- Messages Container -->
      <div
        ref="messageContainer"
        class="h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] p-3 rounded-2xl shadow-sm"
            :class="message.type === 'user' ? 
              'bg-gradient-to-r from-brand-orange to-brand-mint text-white rounded-br-sm' : 
              'bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm rounded-bl-sm'"
          >
            <p class="text-sm">{{ message.content }}</p>
            <span class="text-xs opacity-70 mt-1 block">
              {{ new Date(message.timestamp).toLocaleTimeString('zh-CN') }}
            </span>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex justify-start">
          <div class="bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm p-3 rounded-2xl rounded-bl-sm shadow-sm">
            <div class="flex gap-1">
              <div class="w-2 h-2 rounded-full bg-brand-orange animate-bounce"></div>
              <div class="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm border-t border-brand-orange/10">
        <div class="flex gap-2">
          <textarea
            v-model="inputMessage"
            @keydown="handleKeyDown"
            placeholder="输入你的问题..."
            class="flex-1 bg-white/50 dark:bg-brand-blue/50 backdrop-blur-sm p-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/50 text-sm h-10 custom-scrollbar"
            rows="1"
          ></textarea>
          <button
            @click="sendMessage"
            class="px-4 rounded-xl bg-gradient-to-r from-brand-orange to-brand-mint text-white hover:opacity-90 transition-opacity"
          >
            发送
          </button>
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
  @apply w-2;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-brand-orange/50 rounded-full hover:bg-brand-orange/70 transition-colors;
}
</style>