import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'

const app = createApp(App)

// 确保按正确的顺序使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')