import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = '/api';

interface AuthResponse {
  token: string;
  expiresIn: number;
}

interface User {
  email: string;
}

// 创建axios实例
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// 请求拦截器 - 添加token到请求头
authApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期等情况
authApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      await authApi.post('/auth/sendCode', params);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || '发送验证码失败',
      };
    }
  },

  async verifyCode(email: string, code: string): Promise<{ success: boolean; data?: { token: string; expiresIn: number; user: User }; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('code', code);
      const response = await authApi.post<AuthResponse>('/auth/verifyCode', params);
      
      // 保存token和用户信息
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('user', JSON.stringify({ email }));
      
      return {
        success: true,
        data: { 
          token: response.data.token, 
          expiresIn: response.data.expiresIn,
          user: { email } 
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || '验证码验证失败',
      };
    }
  },

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await authApi.put<{ user: User }>('/auth/profile', updates);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || '更新个人信息失败',
      };
    }
  },

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
}; 