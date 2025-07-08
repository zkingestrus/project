import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 获取用户信息
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      rank: true,
      diamonds: true,
      wins: true,
      losses: true,
      isAdmin: true,
      createdAt: true,
      lastLogin: true,
      gameRecords: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          room: {
            select: {
              id: true,
              createdAt: true,
              endedAt: true
            }
          },
          team: {
            select: {
              teamNumber: true,
              avgRank: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw createError('用户不存在', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// 更新用户信息
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { nickname, avatar } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(nickname && { nickname }),
      ...(avatar && { avatar })
    },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      avatar: true,
      rank: true,
      diamonds: true,
      wins: true,
      losses: true,
      isAdmin: true,
      createdAt: true,
      lastLogin: true
    }
  });

  res.json({
    success: true,
    message: '个人信息更新成功',
    data: updatedUser
  });
}));

// 获取游戏历史记录
router.get('/history', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.gameRecord.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        room: {
          select: {
            id: true,
            createdAt: true,
            startedAt: true,
            endedAt: true
          }
        },
        team: {
          select: {
            teamNumber: true,
            avgRank: true
          }
        }
      }
    }),
    prisma.gameRecord.count({
      where: { userId: req.user!.id }
    })
  ]);

  res.json({
    success: true,
    data: {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

// 获取排行榜
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const type = req.query.type as string || 'rank';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let orderBy: any = { rank: 'desc' };
  if (type === 'wins') {
    orderBy = { wins: 'desc' };
  } else if (type === 'diamonds') {
    orderBy = { diamonds: 'desc' };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        rank: true,
        diamonds: true,
        wins: true,
        losses: true,
        createdAt: true
      }
    }),
    prisma.user.count()
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

export { router as userRouter }; 