import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',  // 设置基础URL
  timeout: 10000    // 设置超时时间
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除本地token
      localStorage.removeItem('token')
      // 可以在这里添加重定向到登录页面的逻辑
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance