// 通用请求函数（使用 Vite 代理，URL 以 /api 开头）

export const request = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')

  // 登录/验证码接口不携带 token
  const isAuthRequest = url.includes('/auth/') || url.includes('verifyCode')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(
      new Headers(options.headers).entries()
    )
  }

  if (!isAuthRequest && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const finalOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials
  }

  const response = await fetch(url, finalOptions)

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    if (!window.location.pathname.includes('/login')) {
      window.location.replace('/login')
    }
    throw new Error('未登录或登录已过期')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || '请求失败')
  }

  const contentType = response.headers.get('content-type')
  const responseText = await response.text()

  if (contentType?.includes('application/json')) {
    try {
      const data = JSON.parse(responseText)

      if (url.includes('verifyCode') && data.token && data.userInfo) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
        window.location.href = '/'
      }

      return data
    } catch {
      return responseText
    }
  }

  return responseText
}

// 封装常用请求方法
export const get = (url: string, options: RequestInit = {}) =>
  request(url, { ...options, method: 'GET' })

export const post = (url: string, data: any, options: RequestInit = {}) =>
  request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  })

export const put = (url: string, data: any, options: RequestInit = {}) =>
  request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  })

export const del = (url: string, options: RequestInit = {}) =>
  request(url, {
    ...options,
    method: 'DELETE'
  })
