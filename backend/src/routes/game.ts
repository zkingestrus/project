import { Router, Response } from 'express';
import { prisma, io } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { GameService } from '../services/GameService';

const router = Router();

// 加入匹配队列
router.post('/match/join', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');

  // 检查用户是否有足够的钻石
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { diamonds: true, rank: true, isOnline: true }
  });

  if (!user) {
    throw createError('用户不存在', 404);
  }

  if (user.diamonds < matchCostDiamonds) {
    throw createError(`钻石不足，需要${matchCostDiamonds}钻石`, 400);
  }

  // 检查用户是否已在队列中
  const existingQueue = await prisma.matchQueue.findUnique({
    where: { userId }
  });

  if (existingQueue) {
    throw createError('您已在匹配队列中', 400);
  }

  // 扣除钻石并加入队列
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { 
        diamonds: { decrement: matchCostDiamonds },
        isOnline: true
      }
    });

    await tx.matchQueue.create({
      data: {
        userId,
        rank: user.rank
      }
    });
  });

  res.json({
    success: true,
    message: '已加入匹配队列',
    data: {
      remainingDiamonds: user.diamonds - matchCostDiamonds
    }
  });
}));

// 离开匹配队列
router.post('/match/leave', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');

  const queueEntry = await prisma.matchQueue.findUnique({
    where: { userId }
  });

  if (!queueEntry) {
    throw createError('您不在匹配队列中', 400);
  }

  // 退出队列并返还钻石
  await prisma.$transaction(async (tx) => {
    await tx.matchQueue.delete({
      where: { userId }
    });

    await tx.user.update({
      where: { id: userId },
      data: { 
        diamonds: { increment: matchCostDiamonds }
      }
    });
  });

  res.json({
    success: true,
    message: '已离开匹配队列'
  });
}));

// 获取匹配队列状态
router.get('/match/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [queueEntry, queueCount] = await Promise.all([
    prisma.matchQueue.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            username: true,
            nickname: true,
            rank: true
          }
        }
      }
    }),
    prisma.matchQueue.count()
  ]);

  res.json({
    success: true,
    data: {
      inQueue: !!queueEntry,
      queueEntry,
      queueCount,
      needPlayers: Math.max(0, 16 - queueCount)
    }
  });
}));

// 获取当前游戏房间
router.get('/room/current', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const gameRecord = await prisma.gameRecord.findFirst({
    where: {
      userId,
      room: {
        status: {
          in: ['READY', 'PLAYING']
        }
      }
    },
    include: {
      room: {
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
      },
      team: true
    }
  });

  if (!gameRecord) {
    return res.json({
      success: true,
      data: null
    });
  }

  res.json({
    success: true,
    data: {
      room: gameRecord.room,
      myTeam: gameRecord.team
    }
  });
}));

// 获取游戏房间详情
router.get('/room/:roomId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!.id;

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

  if (!room) {
    throw createError('游戏房间不存在', 404);
  }

  // 检查用户是否在这个房间中
  const userInRoom = room.teams.some(team => 
    team.gameRecords.some(record => record.userId === userId)
  );

  if (!userInRoom) {
    throw createError('您不在此游戏房间中', 403);
  }

  res.json({
    success: true,
    data: room
  });
}));

// 结束游戏并结算
router.post('/room/:roomId/finish', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!.id;
  const { winnerTeamIds } = req.body as { winnerTeamIds: string[] };

  if (!Array.isArray(winnerTeamIds) || winnerTeamIds.length === 0) {
    throw createError('winnerTeamIds 不能为空', 400);
  }

  // 验证用户在房间内
  const membership = await prisma.gameRecord.findFirst({
    where: {
      roomId,
      userId,
    },
  });

  if (!membership) {
    throw createError('您不在此游戏房间中', 403);
  }

  // 结算
  try {
    const service = new GameService();
    await service.finishGame({ roomId, winnerTeamIds });

    // 向房间内所有玩家广播结算结果
    io.to(roomId).emit('game_results', { roomId, winnerTeamIds });

    res.json({ success: true, message: '结算完成' });
  } catch (error: any) {
    console.error('finishGame error', error);
    throw createError(error.message || '结算失败', 500);
  }
}));

export { router as gameRouter }; 