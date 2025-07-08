import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Space } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  HomeOutlined, 
  UserOutlined, 
  TrophyOutlined, 
  PlayCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  GiftOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'

const { Header } = Layout

export const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { matchQueue } = useGameStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>
    },
    {
      key: '/match',
      icon: <PlayCircleOutlined />,
      label: <Link to="/match">开始匹配</Link>
    },
    {
      key: '/leaderboard',
      icon: <TrophyOutlined />,
      label: <Link to="/leaderboard">排行榜</Link>
    }
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>
    },
    ...(user?.isAdmin ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin">管理后台</Link>
    }] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const getRankBadge = (rank: number) => {
    if (rank >= 3000) return { text: '大师', className: 'rank-master' }
    if (rank >= 2500) return { text: '钻石', className: 'rank-diamond' }
    if (rank >= 2000) return { text: '白金', className: 'rank-platinum' }
    if (rank >= 1500) return { text: '黄金', className: 'rank-gold' }
    if (rank >= 1000) return { text: '白银', className: 'rank-silver' }
    return { text: '青铜', className: 'rank-bronze' }
  }

  const rankBadge = getRankBadge(user?.rank || 0)

  return (
    <Header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md px-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-blue-600">
            积分对战
          </div>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="flex-1 justify-center border-0"
        />

        {/* 用户信息 */}
        <div className="flex items-center space-x-4">
          {/* 匹配状态 */}
          {matchQueue.inQueue && (
            <Badge 
              count={`队列中 ${matchQueue.queueCount}/16`}
              className="animate-pulse"
            />
          )}

          {/* 用户信息 */}
          <Space>
            <div className="flex items-center space-x-2">
              <GiftOutlined className="text-blue-500" />
              <span className="font-medium">{user?.diamonds || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CrownOutlined className="text-yellow-500" />
              <span className="font-medium">{user?.rank || 0}</span>
              <span className={`rank-badge ${rankBadge.className}`}>
                {rankBadge.text}
              </span>
            </div>
          </Space>

          {/* 用户头像菜单 */}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
              <Avatar 
                src={user?.avatar} 
                icon={<UserOutlined />}
                size="small"
              />
              <span className="font-medium">
                {user?.nickname || user?.username}
              </span>
            </div>
          </Dropdown>
        </div>
      </div>
    </Header>
  )
} 