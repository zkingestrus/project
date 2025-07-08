import { Server, Socket } from 'socket.io';
import { prisma } from '../index';

export class MatchService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // 加入匹配队列
  async joinQueue(userId: string, socket: Socket) {
    const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');

    // 检查用户是否有足够的钻石
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { diamonds: true, rank: true }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.diamonds < matchCostDiamonds) {
      throw new Error(`钻石不足，需要${matchCostDiamonds}钻石`);
    }

    // 检查用户是否已在队列中
    const existingQueue = await prisma.matchQueue.findUnique({
      where: { userId }
    });

    if (existingQueue) {
      throw new Error('您已在匹配队列中');
    }

    // 扣除钻石并加入队列
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { diamonds: { decrement: matchCostDiamonds } }
      });

      await tx.matchQueue.create({
        data: {
          userId,
          rank: user.rank
        }
      });
    });

    socket.emit('queue_joined', {
      message: '已加入匹配队列',
      remainingDiamonds: user.diamonds - matchCostDiamonds
    });
  }

  // 离开匹配队列
  async leaveQueue(userId: string, socket: Socket) {
    const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');

    const queueEntry = await prisma.matchQueue.findUnique({
      where: { userId }
    });

    if (!queueEntry) {
      return; // 用户不在队列中，静默返回
    }

    // 退出队列并返还钻石
    await prisma.$transaction(async (tx) => {
      await tx.matchQueue.delete({
        where: { userId }
      });

      await tx.user.update({
        where: { id: userId },
        data: { diamonds: { increment: matchCostDiamonds } }
      });
    });

    socket.emit('queue_left', {
      message: '已离开匹配队列'
    });
  }

  // 检查并创建匹配
  async checkAndCreateMatch() {
    const queuedPlayers = await prisma.matchQueue.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            rank: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    // 检查是否有16个玩家
    if (queuedPlayers.length < 16) {
      return;
    }

    console.log('🎮 开始创建16人匹配...');

    // 取前16个玩家
    const selectedPlayers = queuedPlayers.slice(0, 16);
    
    // 创建游戏房间和队伍
    await this.createGameRoom(selectedPlayers);
  }

  // 创建游戏房间
  private async createGameRoom(players: any[]) {
    try {
      // 根据段位分配队伍
      const teams = this.assignTeams(players);

      const gameRoom = await prisma.$transaction(async (tx) => {
        // 创建游戏房间
        const room = await tx.gameRoom.create({
          data: {
            status: 'READY',
            playerCount: 16,
            startedAt: new Date()
          }
        });

        // 创建8个队伍
        const createdTeams = [];
        for (let i = 0; i < teams.length; i++) {
          const team = teams[i];
          const avgRank = Math.round(team.reduce((sum, p) => sum + p.rank, 0) / team.length);

          const createdTeam = await tx.team.create({
            data: {
              roomId: room.id,
              teamNumber: i + 1,
              avgRank
            }
          });

          // 为每个队伍成员创建游戏记录
          for (const player of team) {
            await tx.gameRecord.create({
              data: {
                userId: player.id,
                roomId: room.id,
                teamId: createdTeam.id
              }
            });
          }

          createdTeams.push({
            ...createdTeam,
            players: team
          });
        }

        // 从匹配队列中移除这些玩家
        await tx.matchQueue.deleteMany({
          where: {
            userId: { in: players.map(p => p.user.id) }
          }
        });

        return { room, teams: createdTeams };
      });

      // 通知所有玩家匹配成功
      for (const player of players) {
        this.io.emit('match_found', {
          roomId: gameRoom.room.id,
          teams: gameRoom.teams,
          message: '匹配成功！游戏即将开始'
        });
      }

      // 广播匹配成功消息
      this.io.emit('match_created', {
        roomId: gameRoom.room.id,
        playerCount: 16,
        teamsCount: 8
      });

      console.log('✅ 游戏房间创建成功:', gameRoom.room.id);

    } catch (error) {
      console.error('❌ 创建游戏房间失败:', error);
      
      // 如果创建失败，返还所有玩家的钻石
      const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');
      await prisma.user.updateMany({
        where: { id: { in: players.map(p => p.user.id) } },
        data: { diamonds: { increment: matchCostDiamonds } }
      });

      // 通知玩家匹配失败
      for (const player of players) {
        this.io.emit('match_failed', {
          message: '匹配失败，钻石已返还'
        });
      }
    }
  }

  // 根据段位分配队伍
  private assignTeams(players: any[]): any[][] {
    // 按段位排序
    const sortedPlayers = players.sort((a, b) => b.user.rank - a.user.rank);
    
    // 创建8个队伍
    const teams: any[][] = Array.from({ length: 8 }, () => []);
    
    // 使用蛇形分配确保队伍平衡
    let teamIndex = 0;
    let direction = 1;
    
    for (const player of sortedPlayers) {
      teams[teamIndex].push(player.user);
      
      if (direction === 1) {
        teamIndex++;
        if (teamIndex === 8) {
          teamIndex = 7;
          direction = -1;
        }
      } else {
        teamIndex--;
        if (teamIndex === -1) {
          teamIndex = 0;
          direction = 1;
        }
      }
    }
    
    return teams;
  }

  // 清理超时的排队玩家，超时后返还钻石并移除
  async cleanupExpiredQueue() {
    const timeoutSeconds = parseInt(process.env.MATCH_TIMEOUT_SECONDS || '300');
    const matchCostDiamonds = parseInt(process.env.MATCH_COST_DIAMONDS || '10');
    const expiredDate = new Date(Date.now() - timeoutSeconds * 1000);

    // 找到过期队列
    const expiredEntries = await prisma.matchQueue.findMany({
      where: {
        joinedAt: { lt: expiredDate },
      },
      select: {
        userId: true,
      },
    });

    if (expiredEntries.length === 0) return;

    const userIds = expiredEntries.map((e) => e.userId);

    await prisma.$transaction(async (tx) => {
      await tx.matchQueue.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { diamonds: { increment: matchCostDiamonds } },
      });
    });

    // 广播更新
    const queueCount = await prisma.matchQueue.count();
    this.io.emit('queue_update', {
      queueCount,
      needPlayers: Math.max(0, 16 - queueCount),
    });

    console.log(`⏰ 清理 ${expiredEntries.length} 个过期排队玩家`);
  }
} 