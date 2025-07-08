import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { gameRouter } from './routes/game';
import { adminRouter } from './routes/admin';
import { setupSocketHandlers } from './socket/handlers';
import { errorHandler } from './middleware/errorHandler';
import { createAdminUser } from './utils/createAdmin';

// 加载环境变量
dotenv.config();

// 初始化数据库
export const prisma = new PrismaClient();

// 创建Express应用
const app = express();
const server = createServer(app);

// 创建Socket.io服务器
export const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
  credentials: true
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由配置
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/game', gameRouter);
app.use('/api/admin', adminRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(errorHandler);

// 设置Socket.io处理器
setupSocketHandlers(io);

// 启动服务器
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 创建管理员账户
    await createAdminUser();
    
    // 启动服务器
    server.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 Socket.io 服务器已启动`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🔄 正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); 