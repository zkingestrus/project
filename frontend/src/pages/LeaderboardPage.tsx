import React, { useEffect, useState } from 'react'
import { Card, Table, Tabs, Avatar, Tag } from 'antd'
import { userAPI } from '../services/api'

const rankColors = [
  { min: 3000, color: 'red', label: '大师' },
  { min: 2500, color: 'purple', label: '钻石' },
  { min: 2000, color: 'blue', label: '白金' },
  { min: 1500, color: 'yellow', label: '黄金' },
  { min: 1000, color: 'gray', label: '白银' },
  { min: 0, color: 'orange', label: '青铜' },
]

function getRankTag(rank: number) {
  const r = rankColors.find(r => rank >= r.min) || rankColors[rankColors.length - 1]
  return <Tag color={r.color}>{r.label}</Tag>
}

interface UserRow {
  id: string
  username: string
  nickname?: string
  avatar?: string
  rank: number
  diamonds: number
  wins: number
  losses: number
}

export const LeaderboardPage: React.FC = () => {
  const [data, setData] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'rank' | 'wins' | 'diamonds'>('rank')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    userAPI.getLeaderboard({ type, limit, page }).then(res => {
      setData(res.data.users)
      setTotal(res.data.pagination.total)
    }).finally(() => setLoading(false))
  }, [type, page])

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (v: string) => <Avatar src={v} />,
    },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '段位', dataIndex: 'rank', key: 'rank', render: (v: number) => getRankTag(v) },
    { title: '分数', dataIndex: 'rank', key: 'score' },
    { title: '钻石', dataIndex: 'diamonds', key: 'diamonds' },
    { title: '胜场', dataIndex: 'wins', key: 'wins' },
    { title: '败场', dataIndex: 'losses', key: 'losses' },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <Card className="w-full max-w-4xl shadow-xl animate-fade-in">
        <Tabs
          defaultActiveKey="rank"
          onChange={key => setType(key as any)}
          items={[
            { key: 'rank', label: '段位榜' },
            { key: 'wins', label: '胜场榜' },
            { key: 'diamonds', label: '钻石榜' },
          ]}
        />
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            total,
            pageSize: limit,
            current: page,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </Card>
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