<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'

const colorMode = useColorMode()
const route = useRoute()

onMounted(() => {
  // Initialize dark mode based on system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode.value = 'dark'
  }
})
</script>

<template>
  <div class="min-h-screen">
    <Navigation />
    <RouterView v-slot="{ Component }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </div>
</template>