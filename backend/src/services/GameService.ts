import { prisma } from '../index';

export interface FinishGameOptions {
  roomId: string;
  winnerTeamIds: string[]; // 获胜队伍 ID 列表
}

export class GameService {
  /**
   * 结束游戏并结算结果
   * @param opts FinishGameOptions
   */
  async finishGame(opts: FinishGameOptions) {
    const { roomId, winnerTeamIds } = opts;

    // 获取房间及其所有团队/玩家
    const room = await prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        teams: {
          include: {
            gameRecords: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error('游戏房间不存在');
    }

    if (room.status === 'FINISHED') {
      throw new Error('房间已结算');
    }

    // 定义简单的胜负奖励规则
    const RANK_WIN = 30;
    const RANK_LOSE = -20;
    const DIAMOND_WIN = 20;
    const DIAMOND_LOSE = 0;

    // 分别处理各队
    await prisma.$transaction(async (tx) => {
      // 更新房间状态
      await tx.gameRoom.update({
        where: { id: roomId },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
        },
      });

      // 遍历所有记录
      for (const team of room.teams) {
        const isWinner = winnerTeamIds.includes(team.id);
        const result = isWinner ? 'WIN' : 'LOSE';
        const rankChange = isWinner ? RANK_WIN : RANK_LOSE;
        const diamondEarned = isWinner ? DIAMOND_WIN : DIAMOND_LOSE;

        for (const record of team.gameRecords) {
          // 更新记录结果
          await tx.gameRecord.update({
            where: { id: record.id },
            data: {
              result,
              rankChange,
              diamondsEarned: diamondEarned,
            },
          });

          // 更新用户统计
          const userUpdateData: any = {
            // rank: { increment: rankChange }, // 根据需求，不再结算段位
            diamonds: { increment: diamondEarned },
          };

          if (isWinner) {
            userUpdateData.wins = { increment: 1 };
          } else {
            userUpdateData.losses = { increment: 1 };
          }

          await tx.user.update({
            where: { id: record.userId },
            data: userUpdateData,
          });
        }
      }
    });

    return { success: true };
  }

  /**
   * 清理长时间未开始或准备的房间
   */
  async cleanupExpiredRooms() {
    const timeoutSeconds = parseInt(process.env.MATCH_TIMEOUT_SECONDS || '300');
    const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');
    const expiredDate = new Date(Date.now() - timeoutSeconds * 1000);

    // 查找 READY 状态且 startedAt 为空并创建时间过久的房间
    const expiredRooms = await prisma.gameRoom.findMany({
      where: {
        status: 'READY',
        createdAt: { lt: expiredDate },
      },
      include: {
        gameRecords: true,
      },
    });

    if (expiredRooms.length === 0) return;

    for (const room of expiredRooms) {
      const userIds = room.gameRecords.map((r) => r.userId);

      await prisma.$transaction(async (tx) => {
        // 删除记录 & 房间
        await tx.gameRecord.deleteMany({ where: { roomId: room.id } });
        await tx.team.deleteMany({ where: { roomId: room.id } });
        await tx.gameRoom.delete({ where: { id: room.id } });

        // 返还钻石
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { diamonds: { increment: matchCostDiamonds } },
        });
      });

      // 广播房间取消
      const { io } = await import('../index');
      io.to(room.id).emit('match_canceled', { roomId: room.id });
    }

    console.log(`⏰ 清理 ${expiredRooms.length} 个过期房间并已退款`);
  }
} 