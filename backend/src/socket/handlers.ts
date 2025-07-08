import { Server, Socket } from 'socket.io';
import { prisma } from '../index';
import { MatchService } from '../services/MatchService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupSocketHandlers = (io: Server) => {
  const matchService = new MatchService(io);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('🔗 客户端连接:', socket.id);

    // 用户认证
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        
        // 这里应该验证JWT token，简化处理
        if (!token) {
          socket.emit('auth_error', { message: '未提供认证令牌' });
          return;
        }

        // 简化的用户认证逻辑
        const user = await prisma.user.findFirst({
          where: { id: token }, // 实际应该解析JWT
          select: {
            id: true,
            username: true,
            nickname: true,
            rank: true,
            diamonds: true,
            isOnline: true
          }
        });

        if (!user) {
          socket.emit('auth_error', { message: '用户不存在' });
          return;
        }

        socket.userId = user.id;
        socket.username = user.username;

        // 更新用户在线状态
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true }
        });

        socket.emit('authenticated', { user });
        console.log('✅ 用户认证成功:', user.username);

      } catch (error) {
        console.error('❌ 认证失败:', error);
        socket.emit('auth_error', { message: '认证失败' });
      }
    });

    // 加入匹配队列
    socket.on('join_match_queue', async () => {
      if (!socket.userId) {
        socket.emit('error', { message: '请先登录' });
        return;
      }

      try {
        await matchService.joinQueue(socket.userId, socket);
        
        // 广播队列状态更新
        const queueCount = await prisma.matchQueue.count();
        io.emit('queue_update', { 
          queueCount,
          needPlayers: Math.max(0, 16 - queueCount)
        });

        console.log(`👥 用户 ${socket.username} 加入匹配队列`);
      } catch (error) {
        console.error('❌ 加入队列失败:', error);
        socket.emit('error', { message: '加入队列失败' });
      }
    });

    // 离开匹配队列
    socket.on('leave_match_queue', async () => {
      if (!socket.userId) {
        socket.emit('error', { message: '请先登录' });
        return;
      }

      try {
        await matchService.leaveQueue(socket.userId, socket);
        
        // 广播队列状态更新
        const queueCount = await prisma.matchQueue.count();
        io.emit('queue_update', { 
          queueCount,
          needPlayers: Math.max(0, 16 - queueCount)
        });

        console.log(`👋 用户 ${socket.username} 离开匹配队列`);
      } catch (error) {
        console.error('❌ 离开队列失败:', error);
        socket.emit('error', { message: '离开队列失败' });
      }
    });

    // 加入游戏房间
    socket.on('join_room', async (data) => {
      if (!socket.userId) {
        socket.emit('error', { message: '请先登录' });
        return;
      }

      try {
        const { roomId } = data;
        socket.join(roomId);
        
        // 获取房间信息
        const room = await prisma.gameRoom.findUnique({
          where: { id: roomId },
          include: {
            teams: {
              include: {
                gameRecords: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                        nickname: true,
                        rank: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (room) {
          socket.emit('room_joined', { room });
          socket.to(roomId).emit('player_joined', { 
            userId: socket.userId,
            username: socket.username
          });
        }

        console.log(`🏠 用户 ${socket.username} 加入房间 ${roomId}`);
      } catch (error) {
        console.error('❌ 加入房间失败:', error);
        socket.emit('error', { message: '加入房间失败' });
      }
    });

    // 离开游戏房间
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('player_left', { 
        userId: socket.userId,
        username: socket.username
      });
      console.log(`🚪 用户 ${socket.username} 离开房间 ${roomId}`);
    });

    // 游戏准备
    socket.on('game_ready', async (data) => {
      if (!socket.userId) {
        socket.emit('error', { message: '请先登录' });
        return;
      }

      try {
        const { roomId } = data;
        
        // 更新用户准备状态（这里可以扩展数据库模型）
        socket.to(roomId).emit('player_ready', { 
          userId: socket.userId,
          username: socket.username
        });

        console.log(`✅ 用户 ${socket.username} 在房间 ${roomId} 准备完成`);
      } catch (error) {
        console.error('❌ 游戏准备失败:', error);
        socket.emit('error', { message: '游戏准备失败' });
      }
    });

    // 断开连接
    socket.on('disconnect', async () => {
      if (socket.userId) {
        try {
          // 更新用户离线状态
          await prisma.user.update({
            where: { id: socket.userId },
            data: { isOnline: false }
          });

          // 如果用户在匹配队列中，自动离开
          await matchService.leaveQueue(socket.userId, socket);

          console.log(`🔌 用户 ${socket.username} 断开连接`);
        } catch (error) {
          console.error('❌ 处理断开连接失败:', error);
        }
      }
    });
  });

  // 定期检查匹配队列
  setInterval(async () => {
    try {
      await matchService.checkAndCreateMatch();
      await matchService.cleanupExpiredQueue();
      const { GameService } = await import('../services/GameService');
      const gs = new GameService();
      await gs.cleanupExpiredRooms();
    } catch (error) {
      console.error('❌ 检查匹配失败:', error);
    }
  }, 5000); // 每5秒检查一次

  console.log('📡 Socket.io 事件处理器已设置');
}; 