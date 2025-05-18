// 扩展 RequestInit 类型
interface ExtendedRequestInit extends RequestInit {
  params?: Record<string, any>;
}

// 通用请求函数（使用 Vite 代理，URL 以 /api 开头）
export const request = async (url: string, options: ExtendedRequestInit = {}) => {
  const token = localStorage.getItem('token')

  // 登录/验证码接口不携带 token
  const isAuthRequest = url.includes('/auth/') || url.includes('verifyCode')

  const headers: Record<string, string> = {
    ...Object.fromEntries(
      new Headers(options.headers).entries()
    )
  }

  if (!isAuthRequest && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 处理查询参数
  let finalUrl = url
  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      finalUrl += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const finalOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials
  }

  const response = await fetch(finalUrl, finalOptions)

  if (response.status === 413) {
    throw new Error('文件大小超过100MB限制')
  }
  if (response.status === 415) {
    throw new Error('不支持的文件类型')
  }
  
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
export const get = (url: string, options: ExtendedRequestInit = {}) =>
  request(url, { ...options, method: 'GET' })

export const post = (url: string, data: any, options: ExtendedRequestInit = {}) =>
  request(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

export const multipartPost = (url: string, formData: FormData, options: ExtendedRequestInit = {}) => {
  const { headers, ...restOptions } = options
  return request(url, {
    ...restOptions,
    method: 'POST',
    body: formData,
    headers: {
      ...headers,
    }
  })
}

export const put = (url: string, data: any, options: ExtendedRequestInit = {}) =>
  request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  })

export const del = (url: string, options: ExtendedRequestInit = {}) =>
  request(url, {
    ...options,
    method: 'DELETE'
  })
