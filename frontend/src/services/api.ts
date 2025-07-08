import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期，清除登录状态
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// 认证API
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  
  register: (data: { 
    username: string; 
    email: string; 
    password: string; 
    nickname?: string 
  }) =>
    api.post('/auth/register', data),
  
  logout: () =>
    api.post('/auth/logout')
}

// 用户API
export const userAPI = {
  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    api.put('/user/profile', data),
  
  getHistory: (params: { page?: number; limit?: number }) =>
    api.get('/user/history', { params }),
  
  getLeaderboard: (params: { 
    type?: 'rank' | 'wins' | 'diamonds'; 
    page?: number; 
    limit?: number 
  }) =>
    api.get('/user/leaderboard', { params })
}

// 游戏API
export const gameAPI = {
  joinMatch: () =>
    api.post('/game/match/join'),
  
  leaveMatch: () =>
    api.post('/game/match/leave'),
  
  getMatchStatus: () =>
    api.get('/game/match/status'),
  
  getCurrentRoom: () =>
    api.get('/game/room/current'),
  
  getRoom: (roomId: string) =>
    api.get(`/game/room/${roomId}`)
}

// 管理员API
export const adminAPI = {
  getUsers: (params: { 
    page?: number; 
    limit?: number; 
    search?: string 
  }) =>
    api.get('/admin/users', { params }),
  
  updateUser: (userId: string, data: {
    rank?: number;
    diamonds?: number;
    wins?: number;
    losses?: number;
    isAdmin?: boolean;
  }) =>
    api.put(`/admin/users/${userId}`, data),
  
  batchUpdateDiamonds: (data: {
    userIds: string[];
    diamonds: number;
    operation: 'add' | 'subtract' | 'set';
  }) =>
    api.post('/admin/users/batch-diamonds', data),
  
  getStats: () =>
    api.get('/admin/stats'),
  
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`)
}

export default api 