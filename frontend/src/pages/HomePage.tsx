import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center relative bg-cover bg-center"
      style={{ backgroundImage: "url('/images/home-bg.jpg')" }}
    >
      {/* 叠加层 */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <div className="z-10 w-full max-w-2xl text-center animate-fade-in">
        <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg">积分对战平台</h1>
        <p className="text-xl text-gray-200 mb-6">16人实时匹配 · 8队公平竞技 · 段位系统 · 钻石经济</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
          <Button type="primary" size="large" className="px-10 py-2 text-lg shadow-lg" onClick={() => navigate('/match')}>立即开始匹配</Button>
          <Button size="large" className="px-10 py-2 text-lg" onClick={() => navigate('/leaderboard')}>查看排行榜</Button>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center mt-8">
          <div className="bg-white/80 rounded-xl shadow p-6 min-w-[180px]">
            <div className="text-2xl font-bold text-blue-600 mb-2">16人匹配</div>
            <div className="text-gray-500">满员自动开局，极致公平</div>
          </div>
          <div className="bg-white/80 rounded-xl shadow p-6 min-w-[180px]">
            <div className="text-2xl font-bold text-cyan-600 mb-2">段位分队</div>
            <div className="text-gray-500">智能算法，实力均衡</div>
          </div>
          <div className="bg-white/80 rounded-xl shadow p-6 min-w-[180px]">
            <div className="text-2xl font-bold text-yellow-500 mb-2">钻石消耗</div>
            <div className="text-gray-500">每场消耗，奖励更丰厚</div>
          </div>
        </div>
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