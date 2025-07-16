import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'

const { Title } = Typography

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values) as any
      if (response.success) {
        setUser(response.data.user)
        setToken(response.data.token)
        message.success('登录成功！')
        navigate('/')
      } else {
        console.error(response.message)
        message.error(response.message || '登录失败')
      }
    } catch (error: any) {
      console.error(error)
      message.error(error.response?.data?.message || '登录时发生错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600">
            积分对战网站
          </Title>
          <p className="text-gray-600">登录您的账户</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱！' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名或邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-600">还没有账户？</span>
            <Link to="/register" className="ml-2 text-blue-600 hover:text-blue-800">
              立即注册
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
} 