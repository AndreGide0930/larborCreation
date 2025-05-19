<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <label class="flex items-center justify-between p-4 glass rounded-xl cursor-pointer hover:bg-brand-orange/5 transition-colors">
      <span>{{ t('profile.darkMode') }}</span>
      <div class="relative">
        <input
          v-model="settingsStore.darkMode"
          type="checkbox"
          class="sr-only"
        >
        <div class="w-14 h-7 bg-gray-200 rounded-full transition-colors duration-200"
          :class="{ 'bg-brand-orange': settingsStore.darkMode }">
          <div class="w-7 h-7 bg-white rounded-full shadow transform transition-transform duration-200"
            :class="{ 'translate-x-7': settingsStore.darkMode }"></div>
        </div>
      </div>
    </label>
  </div>
</template>