// src/services/api.ts
import { Creation } from '../types/Creation';

export const fetchCreations = async (): Promise<Creation[]> => {
  try {
    const response = await fetch('/api/'); // 通过代理访问后端的 `/` 接口
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching creations:', error);
    throw error;
  }
};