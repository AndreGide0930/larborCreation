import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export const useSettingsStore = defineStore('settings', () => {
  const { locale } = useI18n()
  
  const language = ref(localStorage.getItem('language') || 'zh')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')

  watch(language, (newValue) => {
    localStorage.setItem('language', newValue)
    locale.value = newValue
  })

  watch(darkMode, (newValue) => {
    localStorage.setItem('darkMode', String(newValue))
    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }

  const setLanguage = (lang: string) => {
    language.value = lang
  }

  return {
    language,
    darkMode,
    toggleDarkMode,
    setLanguage
  }
})