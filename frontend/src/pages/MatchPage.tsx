import React, { useState, useEffect } from 'react'
import { Card, Button, Alert, Spin, Progress, message } from 'antd'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { gameAPI } from '../services/api'
import socketService from '../services/socket'

export const MatchPage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const { 
    matchQueue, 
    setMatchQueue, 
    isMatching, 
    setMatching,
    isSocketAuthenticated,
    isConnected,
  } = useGameStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      socketService.connect()
    }
  }, [isConnected])

  // 加入匹配
  const handleJoinMatch = async () => {
    if (!user) return
    if (user.diamonds < 10) {
      message.error('钻石不足，无法参与匹配！')
      return
    }
    setLoading(true)
    setMatching(true)
    try {
      // 推荐用socketService，后端也支持API
      socketService.joinMatchQueue()
      message.success('已加入匹配队列，等待其他玩家...')
      setMatchQueue({ ...matchQueue, inQueue: true })
    } catch (e) {
      message.error('加入匹配失败')
      setMatching(false)
    } finally {
      setLoading(false)
    }
  }

  // 离开匹配
  const handleLeaveMatch = async () => {
    setLoading(true)
    try {
      socketService.leaveMatchQueue()
      setMatchQueue({ ...matchQueue, inQueue: false })
      setMatching(false)
      message.info('已离开匹配队列')
    } catch (e) {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-[80vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/images/match-bg.png')" }}
    >
      {/* 叠加层 */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <Card
        className="w-full max-w-lg shadow-lg z-10 bg-white/20 backdrop-blur-md"
        bordered={false}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-white">开始匹配</h1>
          <div className="text-gray-200 mb-2">
            16人同时匹配，8队分组对战，钻石不足无法参与
          </div>
          <div className="flex justify-center gap-6 mb-2 text-white">
            <span>💎{user?.diamonds ?? 0}</span>
            <span>🏆{user?.rank ?? 0}</span>
          </div>
        </div>

        {/* 匹配状态 */}
        {matchQueue.inQueue ? (
          <Alert
            message={`已加入匹配队列，当前人数：${matchQueue.queueCount}/16`}
            type="info"
            showIcon
            className="mb-4 bg-blue-100/80 border-blue-300"
          />
        ) : (
          <Alert
            message={`当前匹配队列人数：${matchQueue.queueCount}/16`}
            type="warning"
            showIcon
            className="mb-4 bg-yellow-100/80 border-yellow-300"
          />
        )}

        <Progress
          percent={Math.min(100, Math.round((matchQueue.queueCount / 16) * 100))}
          status={matchQueue.queueCount >= 16 ? 'success' : 'active'}
          className="mb-4"
        />

        <div className="flex flex-col items-center gap-4">
          {matchQueue.inQueue ? (
            <Button danger loading={loading} onClick={handleLeaveMatch} size="large">
              离开匹配队列
            </Button>
          ) : (
            <Button 
              type="primary" 
              loading={loading || !isSocketAuthenticated} 
              onClick={handleJoinMatch} 
              size="large"
              disabled={!isSocketAuthenticated}
            >
              {isSocketAuthenticated ? '加入匹配（消耗10钻石）' : '正在连接...'}
            </Button>
          )}
          {isMatching && <Spin className="mt-2" tip="等待其他玩家加入..." />}
        </div>
      </Card>
    </div>
  )
} 