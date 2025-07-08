import React, { useEffect, useState } from 'react'
import { Card, Avatar, Progress, Descriptions, Table, Tag } from 'antd'
import { useAuthStore } from '../store/authStore'
import { userAPI } from '../services/api'

interface RecordRow {
  id: string
  room: { id: string; createdAt: string }
  team: { teamNumber: number }
  result: 'WIN' | 'LOSE' | 'DRAW' | null
  rankChange: number
  diamondsEarned: number
  createdAt: string
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()
  const [history, setHistory] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await userAPI.getHistory({ limit: 10 })
        setHistory(res.data.records)
      } catch (e) {}
      setLoading(false)
    }
    fetch()
  }, [])

  const columns = [
    { title: '房间', dataIndex: ['room', 'id'], render: (v: string) => v.slice(0, 6) },
    { title: '队伍', dataIndex: ['team', 'teamNumber'] },
    { title: '结果', dataIndex: 'result', render: (v: string) => v ? <Tag color={v === 'WIN' ? 'green' : v === 'LOSE' ? 'red' : 'default'}>{v}</Tag> : '-' },
    { title: '段位变化', dataIndex: 'rankChange' },
    { title: '钻石', dataIndex: 'diamondsEarned' },
    { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
  ]

  return (
    <div className="min-h-[80vh] flex flex-col items-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl animate-fade-in">
        {/* 用户信息卡 */}
        <Card className="flex flex-col items-center p-8 shadow-xl min-w-[260px] bg-white/90">
          <Avatar src={user?.avatar} size={96} className="mb-4 shadow-lg" />
          <div className="text-2xl font-bold mb-1">{user?.nickname || user?.username}</div>
          <div className="text-gray-500 mb-2">ID: {user?.id}</div>
          <div className="flex gap-4 mb-2">
            <span className="font-semibold text-blue-600">段位 {user?.rank}</span>
            <span className="font-semibold text-yellow-500">钻石 {user?.diamonds}</span>
          </div>
          <Progress percent={Math.min(100, (user?.rank ?? 0) / 30)} showInfo={false} strokeColor="#1677ff" className="w-full" />
        </Card>
        {/* 详细数据 */}
        <Card className="flex-1 shadow-xl bg-white/90">
          <Descriptions title="详细信息" column={2} size="middle">
            <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{user?.createdAt}</Descriptions.Item>
            <Descriptions.Item label="胜场">{user?.wins}</Descriptions.Item>
            <Descriptions.Item label="败场">{user?.losses}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      {/* 历史 */}
      <div className="w-full max-w-4xl mt-10 animate-fade-in">
        <Card title="最近对局" className="shadow-xl bg-white/90">
          <Table
            dataSource={history}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeInUp 1s cubic-bezier(.23,1.01,.32,1) both; }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
} 