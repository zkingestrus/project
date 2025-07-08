import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { generateToken } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 用户注册
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, nickname } = req.body;

  // 验证输入
  if (!username || !email || !password) {
    throw createError('用户名、邮箱和密码不能为空', 400);
  }

  if (password.length < 6) {
    throw createError('密码至少需要6位', 400);
  }

  // 检查用户是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email }
      ]
    }
  });

  if (existingUser) {
    throw createError('用户名或邮箱已存在', 409);
  }

  // 创建用户
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      nickname: nickname || username,
      diamonds: 100, // 新用户送100钻石
      rank: 1000     // 初始段位1000分
    },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      rank: true,
      diamonds: true,
      isAdmin: true,
      createdAt: true
    }
  });

  // 生成JWT token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user,
      token
    }
  });
}));

// 用户登录
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw createError('用户名和密码不能为空', 400);
  }

  // 查找用户
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username }
      ]
    }
  });

  if (!user) {
    throw createError('用户名或密码错误', 401);
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError('用户名或密码错误', 401);
  }

  // 更新最后登录时间和在线状态
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      isOnline: true
    }
  });

  // 生成JWT token
  const token = generateToken(user.id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        rank: user.rank,
        diamonds: user.diamonds,
        wins: user.wins,
        losses: user.losses,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

// 用户登出
router.post('/logout', asyncHandler(async (req, res) => {
  // 这里可以添加token黑名单逻辑
  res.json({
    success: true,
    message: '登出成功'
  });
}));

export { router as authRouter }; 