import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
  Statistic,
} from 'antd'
import { adminAPI } from '../services/api'

interface User {
  id: string
  username: string
  nickname?: string
  email: string
  rank: number
  diamonds: number
  wins: number
  losses: number
  isAdmin: boolean
  createdAt: string
}

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // stats
  const [stats, setStats] = useState<any>(null)

  // edit modal
  const [editVisible, setEditVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm] = Form.useForm()

  // batch modal
  const [batchVisible, setBatchVisible] = useState(false)
  const [batchForm] = Form.useForm()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getUsers({ page, limit, search })
      setUsers(res.data.users)
      setTotal(res.data.pagination.total)
    } catch (err: any) {
      message.error(err.message || '获取用户失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats()
      setStats(res.data)
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSearch = (value: string) => {
    setPage(1)
    setSearch(value.trim())
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditVisible(true)
  }

  const handleFinish = async (values: any) => {
    if (!editingUser) return

    try {
      const payload = {
        ...values,
        rank: Number(values.rank),
        diamonds: Number(values.diamonds),
        wins: Number(values.wins),
        losses: Number(values.losses),
      }
      const res = await adminAPI.updateUser(editingUser.id, payload)
      message.success('更新成功')
      setUsers(users.map(u => (u.id === editingUser.id ? res.data : u)))
      setEditVisible(false)
    } catch (err: any) {
      message.error(err.message || '更新失败')
    }
  }

  const submitBatch = async () => {
    try {
      const values = await batchForm.validateFields()
      await adminAPI.batchUpdateDiamonds({
        userIds: selectedRowKeys as string[],
        diamonds: values.diamonds,
        operation: values.operation,
      })
      message.success('批量操作成功')
      setBatchVisible(false)
      setSelectedRowKeys([])
      fetchUsers()
    } catch (err: any) {
      message.error(err.message || '批量操作失败')
    }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '段位', dataIndex: 'rank' },
    { title: '钻石', dataIndex: 'diamonds' },
    { title: '胜', dataIndex: 'wins' },
    { title: '负', dataIndex: 'losses' },
    {
      title: '管理员',
      dataIndex: 'isAdmin',
      render: (v: boolean) => (v ? <Tag color="green">✔</Tag> : <Tag>✖</Tag>),
    },
    {
      title: '操作',
      render: (_: any, record: User) => (
        <Button size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* 统计卡 */}
        {stats && (
          <Space size="large" wrap>
            <Card><Statistic title="注册用户" value={stats.totalUsers} /></Card>
            <Card><Statistic title="在线用户" value={stats.onlineUsers} /></Card>
            <Card><Statistic title="总对局" value={stats.totalGames} /></Card>
            <Card><Statistic title="排队人数" value={stats.activeMatches} /></Card>
            <Card><Statistic title="全服钻石" value={stats.totalDiamonds} /></Card>
          </Space>
        )}

        {/* 工具栏 */}
        <Space style={{ width: '100%' }} wrap>
          <Input.Search
            placeholder="搜索用户名/邮箱/昵称"
            allowClear
            enterButton
            onSearch={handleSearch}
            style={{ maxWidth: 300 }}
          />
          <Button
            type="primary"
            disabled={selectedRowKeys.length === 0}
            onClick={() => setBatchVisible(true)}
          >
            批量修改钻石
          </Button>
        </Space>

        {/* 用户表格 */}
        <Card>
          <Table
            rowKey="id"
            dataSource={users}
            columns={columns}
            loading={loading}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              total,
              pageSize: limit,
              current: page,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
          />
        </Card>
      </div>

      {/* 编辑用户 */}
      <Modal
        title="编辑用户"
        open={editVisible}
        onOk={() => editForm.submit()}
        onCancel={() => setEditVisible(false)}
        destroyOnClose
      >
        {editingUser && (
          <Form
            key={editingUser.id}
            form={editForm}
            labelCol={{ span: 6 }}
            initialValues={editingUser}
            onFinish={handleFinish}
          >
            <Form.Item label="段位" name="rank" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="钻石" name="diamonds" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="胜场" name="wins" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="败场" name="losses" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="管理员" name="isAdmin" valuePropName="checked">
              <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 批量钻石 */}
      <Modal
        title="批量修改钻石"
        open={batchVisible}
        onOk={submitBatch}
        onCancel={() => setBatchVisible(false)}
        afterClose={() => batchForm.resetFields()}
      >
        <Form form={batchForm} labelCol={{ span: 6 }}>
          <Form.Item label="操作" name="operation" rules={[{ required: true }]}> <Select options={[{ value: 'add', label: '增加' }, { value: 'subtract', label: '减少' }, { value: 'set', label: '设为' }]} /> </Form.Item>
          <Form.Item label="钻石" name="diamonds" rules={[{ required: true }]}> <InputNumber min={1} /> </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(.23,1.01,.32,1) both; }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
} 