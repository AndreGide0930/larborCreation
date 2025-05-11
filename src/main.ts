import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 确保按正确的顺序使用插件
app.use(createPinia())
app.use(router)

app.mount('#app')