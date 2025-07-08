import bcrypt from 'bcryptjs';
import { prisma } from '../index';

export const createAdminUser = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      console.log('✅ 管理员账户已存在');
      return;
    }

    // 创建管理员账户
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        nickname: '系统管理员',
        isAdmin: true,
        diamonds: 999999,
        rank: 9999
      }
    });

    console.log('✅ 管理员账户创建成功:', admin.username);
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error);
  }
}; 