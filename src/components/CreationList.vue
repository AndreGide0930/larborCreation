<!-- CreationList.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { fetchCreations } from '../services/api'

const creations = ref([])
const error = ref(null)

onMounted(async () => {
  try {
    creations.value = await fetchCreations()
  } catch (err) {
    error.value = 'Failed to load creations. Please try again later.'
  }
})
</script>

<template>
  <div v-if="error" class="error">{{ error }}</div>
  <div v-else class="creations-list">
    <h1>Creations</h1>
    <ul>
      <li v-for="creation in creations" :key="creation.id">
        <h2>{{ creation.name }}</h2>
      </li>
    </ul>
  </div>
</template>