// API基础URL
const BASE_URL = 'http://localhost:8080'

// 创建一个通用的请求函数
export const request = async (url: string, options: RequestInit = {}) => {
  // 构建完整的URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // 如果是登录相关的请求，不需要带token
  if (url.includes('/auth/')) {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': (options.headers as Record<string, string>)?.[`Content-Type`] || 'application/json',
        ...options.headers
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '请求失败')
    }

    const contentType = response.headers.get('content-type')
    const responseText = await response.text()

    if (contentType?.includes('application/json')) {
      try {
        return JSON.parse(responseText)
      } catch {
        return responseText
      }
    }
    return responseText
  }

  const token = localStorage.getItem('token')
  
  // 如果需要token但没有token，直接抛出错误
  if (!token) {
    throw new Error('未登录')
  }

  // 合并默认headers和传入的headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }

  // 合并选项
  const finalOptions = {
    ...options,
    headers
  }

  try {
    const response = await fetch(fullUrl, finalOptions)
    
    // 处理401未授权的情况
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 只在非登录页面时重定向，并且只重定向一次
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
      throw new Error('未登录或登录已过期')
    }

    // 处理其他错误
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '请求失败')
    }

    const contentType = response.headers.get('content-type')
    const responseText = await response.text()

    if (contentType?.includes('application/json')) {
      try {
        return JSON.parse(responseText)
      } catch {
        return responseText
      }
    }
    return responseText
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('请求失败')
  }
}

// POST请求
export const post = (url: string, data: any, options: RequestInit = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : null,
    headers: {
      'Content-Type': data ? 'application/json' : 'application/x-www-form-urlencoded',
      ...options.headers
    }
  })
}

// GET请求
export const get = (url: string, options: RequestInit = {}) => {
  return request(url, {
    ...options,
    method: 'GET'
  })
}

// PUT请求
export const put = (url: string, data: any, options: RequestInit = {}) => {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// DELETE请求
export const del = (url: string, options: RequestInit = {}) => {
  return request(url, {
    ...options,
    method: 'DELETE'
  })
}