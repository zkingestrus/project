import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    if (this.socket?.connected) return

    // 动态判断后端地址
    const VITE_SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    const backendUrl = import.meta.env.PROD
      ? `${window.location.protocol}//${window.location.hostname}`
      : VITE_SOCKET_URL || 'http://localhost:3001';

    console.log('Socket connecting to:', backendUrl);

    this.socket = io(backendUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventListeners()
    this.socket.connect()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    // 连接事件
    this.socket.on('connect', () => {
      console.log('✅ Socket连接成功')
      useGameStore.getState().setConnected(true)
      useGameStore.getState().setSocketAuthenticated(false) // 连接时重置认证状态
      this.reconnectAttempts = 0
      
      // 发送认证信息
      const token = useAuthStore.getState().token
      if (token) {
        this.socket?.emit('authenticate', { token })
      }
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket连接断开')
      useGameStore.getState().setConnected(false)
      useGameStore.getState().setSocketAuthenticated(false) // 断开连接时重置
    })

    // 认证事件
    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket认证成功', data.user)
      useGameStore.getState().setSocketAuthenticated(true) // 认证成功后设置状态
    })

    this.socket.on('auth_error', (data) => {
      console.error('❌ Socket认证失败', data.message)
    })

    // 匹配队列事件
    this.socket.on('queue_joined', (data) => {
      console.log('✅ 加入匹配队列成功', data)
      useAuthStore.getState().updateUser({ 
        diamonds: data.remainingDiamonds 
      })
    })

    this.socket.on('queue_left', (data) => {
      console.log('✅ 离开匹配队列成功', data)
    })

    this.socket.on('queue_update', (data) => {
      console.log('📊 匹配队列更新', data)
      useGameStore.getState().setMatchQueue({
        inQueue: useGameStore.getState().matchQueue.inQueue,
        queueCount: data.queueCount,
        needPlayers: data.needPlayers
      })
    })

    // 匹配成功事件
    this.socket.on('match_found', (data) => {
      console.log('🎉 匹配成功!', data)
      useGameStore.getState().setCurrentRoom(data.room)
      useGameStore.getState().setMatching(false)
      
      // 可以在这里跳转到游戏页面
      window.location.href = `/game/${data.roomId}`
    })

    this.socket.on('match_failed', (data) => {
      console.log('❌ 匹配失败', data.message)
      useGameStore.getState().setMatching(false)
    })

    // 游戏房间事件
    this.socket.on('room_joined', (data) => {
      console.log('🏠 加入游戏房间', data.room)
      useGameStore.getState().setCurrentRoom(data.room)
    })

    this.socket.on('player_joined', (data) => {
      console.log('👥 玩家加入房间', data)
    })

    this.socket.on('player_left', (data) => {
      console.log('👋 玩家离开房间', data)
    })

    this.socket.on('player_ready', (data) => {
      console.log('✅ 玩家准备完成', data)
    })

    // 游戏结果
    this.socket.on('game_results', (data) => {
      console.log('�� 游戏结算', data)
      useGameStore.getState().setCurrentRoom(null)
      // 可以跳转到结果页或弹窗
    })

    // 房间被取消（超时）
    this.socket.on('match_canceled', (data) => {
      console.log('⚠️ 房间超时取消', data)
      useGameStore.getState().setCurrentRoom(null)
      window.location.href = '/match'
    })

    // 错误事件
    this.socket.on('error', (data) => {
      console.error('❌ Socket错误', data.message)
    })

    // 重连事件
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 重连成功 (尝试 ${attemptNumber})`)
      this.reconnectAttempts = 0
    })

    this.socket.on('reconnect_failed', () => {
      console.error('❌ 重连失败，已达到最大重连次数')
    })
  }

  // 发送事件的方法
  joinMatchQueue() {
    this.socket?.emit('join_match_queue')
  }

  leaveMatchQueue() {
    this.socket?.emit('leave_match_queue')
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join_room', { roomId })
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { roomId })
  }

  gameReady(roomId: string) {
    this.socket?.emit('game_ready', { roomId })
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

// 创建单例实例
export const socketService = new SocketService()

export default socketService 