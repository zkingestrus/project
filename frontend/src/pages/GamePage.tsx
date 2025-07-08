import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Spin, Button, Tag, message } from 'antd'
import { gameAPI } from '../services/api'
import { useGameStore } from '../store/gameStore'
import socketService from '../services/socket'

interface TeamPlayer {
  id: string
  username: string
  nickname?: string
  rank: number
}

interface Team {
  id: string
  teamNumber: number
  avgRank: number
  gameRecords: { user: TeamPlayer }[]
}

interface RoomDetail {
  id: string
  status: string
  teams: Team[]
}

export const GamePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [ready, setReady] = useState(false)

  const myTeamId = useGameStore((s) => s.myTeam?.id)

  // 获取房间信息
  const fetchRoom = async () => {
    if (!roomId) return
    try {
      const res = await gameAPI.getRoom(roomId)
      const roomData = (res as any).data ?? res
      setRoom(roomData)
      setLoading(false)
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取房间信息失败')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoom()
    // 监听房间更新（可根据后端事件扩展）
    // socketService.socket?.on('room_update', fetchRoom)
    // 清理
    return () => {
      // socketService.socket?.off('room_update', fetchRoom)
    }
  }, [roomId])

  const handleReady = () => {
    if (!roomId) return
    socketService.gameReady(roomId)
    setReady(true)
    message.success('已发送准备')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Spin size="large" />
      </div>
    )
  }

  if (!room) {
    return <div className="text-center mt-20 text-gray-500">房间不存在或已结束</div>
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">游戏房间 #{room.id.slice(0, 6)}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {room.teams.map((team) => (
            <Card
              key={team.id}
              className={`shadow-lg ${team.id === myTeamId ? 'border-2 border-green-400' : ''}`}
              title={
                <div className="flex items-center gap-2">
                  <span className="font-semibold">队伍 {team.teamNumber}</span>
                  <Tag color="blue">平均段位 {team.avgRank}</Tag>
                  {team.id === myTeamId && <Tag color="green">我的队伍</Tag>}
                </div>
              }
            >
              <ul className="space-y-1">
                {team.gameRecords.map(({ user }) => (
                  <li key={user.id} className="flex justify-between">
                    <span>{user.nickname || user.username}</span>
                    <span className="text-gray-500">{user.rank}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button type="primary" size="large" disabled={ready} onClick={handleReady}>
            {ready ? '已准备' : '准备'}
          </Button>
        </div>
      </div>
    </div>
  )
} 