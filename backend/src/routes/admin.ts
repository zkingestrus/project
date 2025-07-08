import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 获取所有用户列表
router.get('/users', asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

  const where = search ? {
    OR: [
      { username: { contains: search } },
      { email: { contains: search } },
      { nickname: { contains: search } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        rank: true,
        diamonds: true,
        wins: true,
        losses: true,
        isAdmin: true,
        isOnline: true,
        createdAt: true,
        lastLogin: true
      }
    }),
    prisma.user.count({ where })
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

// 更新用户信息
router.put('/users/:userId', asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { rank, diamonds, wins, losses, isAdmin } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('用户不存在', 404);
  }

  console.log('Admin update request:', { userId, rank, diamonds, wins, losses, isAdmin })

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(rank !== undefined && { rank: parseInt(rank) }),
      ...(diamonds !== undefined && { diamonds: parseInt(diamonds) }),
      ...(wins !== undefined && { wins: parseInt(wins) }),
      ...(losses !== undefined && { losses: parseInt(losses) }),
      ...(isAdmin !== undefined && { isAdmin: Boolean(isAdmin) })
    },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      rank: true,
      diamonds: true,
      wins: true,
      losses: true,
      isAdmin: true,
      isOnline: true,
      createdAt: true,
      lastLogin: true
    }
  });

  console.log('Updated user result:', updatedUser)

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: updatedUser
  });
}));

// 批量更新用户钻石
router.post('/users/batch-diamonds', asyncHandler(async (req: AuthRequest, res) => {
  const { userIds, diamonds, operation } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError('用户ID列表不能为空', 400);
  }

  if (!diamonds || diamonds <= 0) {
    throw createError('钻石数量必须大于0', 400);
  }

  if (!['add', 'subtract', 'set'].includes(operation)) {
    throw createError('操作类型必须是 add, subtract 或 set', 400);
  }

  let updateData: any;
  if (operation === 'add') {
    updateData = { diamonds: { increment: parseInt(diamonds) } };
  } else if (operation === 'subtract') {
    updateData = { diamonds: { decrement: parseInt(diamonds) } };
  } else {
    updateData = { diamonds: parseInt(diamonds) };
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: updateData
  });

  res.json({
    success: true,
    message: `成功更新 ${result.count} 个用户的钻石`,
    data: { updatedCount: result.count }
  });
}));

// 获取系统统计信息
router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalUsers,
    onlineUsers,
    totalGames,
    activeMatches,
    totalDiamonds
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.gameRoom.count(),
    prisma.matchQueue.count(),
    prisma.user.aggregate({
      _sum: { diamonds: true }
    })
  ]);

  const recentGames = await prisma.gameRoom.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      playerCount: true,
      createdAt: true,
      startedAt: true,
      endedAt: true
    }
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      onlineUsers,
      totalGames,
      activeMatches,
      totalDiamonds: totalDiamonds._sum.diamonds || 0,
      recentGames
    }
  });
}));

// 删除用户
router.delete('/users/:userId', asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;

  if (userId === req.user!.id) {
    throw createError('不能删除自己的账户', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('用户不存在', 404);
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  res.json({
    success: true,
    message: '用户删除成功'
  });
}));

export { router as adminRouter }; 