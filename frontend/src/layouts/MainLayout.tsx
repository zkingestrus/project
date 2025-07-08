import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

const { Content } = Layout

export const MainLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主内容区 */}
      <Content className="pt-16 flex justify-center">
        {/* 统一宽度容器 */}
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
} 