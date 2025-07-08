# 积分对战网站

一个基于 React + Node.js 的实时多人对战匹配系统，支持16人同时匹配，8个队伍对战。

## 功能特性

### 核心功能
- ✅ **16人匹配系统** - 需要16个人同时在线才能开始游戏
- ✅ **智能队伍分配** - 根据段位平均分配8个队伍，每队2人
- ✅ **钻石消耗机制** - 每次匹配消耗钻石，增加游戏价值
- ✅ **段位系统** - 完整的段位评级和排行榜
- ✅ **实时通信** - 基于Socket.io的实时匹配和游戏通信

### 用户系统
- ✅ **用户注册/登录** - 完整的认证系统
- ✅ **个人中心** - 查看个人信息、钻石、段位、战绩
- ✅ **游戏历史** - 详细的游戏记录和统计
- ✅ **排行榜** - 段位、胜场、钻石排行

### 管理系统
- ✅ **管理员后台** - 管理所有用户信息
- ✅ **钻石管理** - 批量修改用户钻石
- ✅ **数据统计** - 系统运行数据统计

## 技术栈

### 前端
- **React 18** - 主UI框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Socket.io-client** - 实时通信
- **Vite** - 构建工具

### 后端
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **TypeScript** - 类型安全
- **Socket.io** - 实时通信服务
- **Prisma** - ORM数据库工具
- **JWT** - 用户认证
- **bcrypt** - 密码加密

### 数据库
- **MySQL 8.0** - 主数据库
- **Redis** - 缓存和实时数据

### 部署
- **Docker** - 容器化
- **Docker Compose** - 多容器编排
- **Nginx** - 反向代理

## 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0
- Redis

### 本地开发

1. **克隆项目**
```bash
git clone <项目地址>
cd 积分对战网站
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp backend/env.example backend/.env

# 编辑环境变量
# 修改数据库连接、JWT密钥等配置
```

4. **初始化数据库**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **启动开发服务**
```bash
# 在根目录启动所有服务
npm run dev

# 或分别启动
npm run dev:backend  # 后端 http://localhost:3001
npm run dev:frontend # 前端 http://localhost:5173
```

### Docker 部署

1. **使用 Docker Compose 一键部署**
```bash
docker-compose up -d
```

2. **访问应用**
- 前端: http://localhost
- 后端API: http://localhost:3001
- 数据库: localhost:3306
- Redis: localhost:6379

3. **查看日志**
```bash
docker-compose logs -f
```

## 项目结构

```
积分对战网站/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   ├── socket/         # Socket.io处理
│   │   └── utils/          # 工具函数
│   ├── prisma/             # 数据库模型
│   └── Dockerfile
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # 状态管理
│   │   ├── services/       # API服务
│   │   └── utils/          # 工具函数
│   ├── nginx.conf          # Nginx配置
│   └── Dockerfile
├── docker-compose.yml      # Docker编排
└── README.md
```

## 数据库设计

### 主要表结构

- **users** - 用户信息表
- **match_queue** - 匹配队列表
- **game_rooms** - 游戏房间表
- **teams** - 队伍表
- **game_records** - 游戏记录表

## API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 用户接口
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `GET /api/user/history` - 获取游戏历史
- `GET /api/user/leaderboard` - 获取排行榜

### 游戏接口
- `POST /api/game/match/join` - 加入匹配队列
- `POST /api/game/match/leave` - 离开匹配队列
- `GET /api/game/match/status` - 获取匹配状态
- `GET /api/game/room/current` - 获取当前游戏房间

### 管理员接口
- `GET /api/admin/users` - 获取用户列表
- `PUT /api/admin/users/:id` - 更新用户信息
- `POST /api/admin/users/batch-diamonds` - 批量更新钻石
- `GET /api/admin/stats` - 获取系统统计

## Socket.io 事件

### 客户端发送
- `authenticate` - 用户认证
- `join_match_queue` - 加入匹配队列
- `leave_match_queue` - 离开匹配队列
- `join_room` - 加入游戏房间
- `game_ready` - 游戏准备

### 服务端发送
- `authenticated` - 认证成功
- `queue_update` - 队列状态更新
- `match_found` - 匹配成功
- `room_joined` - 加入房间成功
- `player_ready` - 玩家准备完成

## 配置说明

### 环境变量

```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/battle_arena"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key"

# 服务器配置
PORT=3001
NODE_ENV=development

# Redis配置
REDIS_URL="redis://localhost:6379"

# 游戏配置
MATCH_COST_DIAMONDS=10        # 匹配消耗钻石数
MATCH_TIMEOUT_SECONDS=300     # 匹配超时时间
```

## 部署指南

### 生产环境部署

1. **服务器要求**
   - 2核4G以上配置
   - Docker & Docker Compose
   - 端口 80, 3001, 3306, 6379

2. **安全配置**
   - 修改默认密码
   - 配置防火墙
   - 启用HTTPS
   - 定期备份数据库

3. **性能优化**
   - 配置Redis持久化
   - 设置MySQL连接池
   - 启用Nginx缓存
   - 监控系统资源

## 开发指南

### 添加新功能
1. 后端：在 `backend/src/routes/` 添加路由
2. 前端：在 `frontend/src/pages/` 添加页面
3. 数据库：修改 `backend/prisma/schema.prisma`
4. 实时功能：在 `backend/src/socket/` 添加事件处理

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式写法
- API 统一错误处理

## 许可证

MIT License

## 联系方式

如有问题请提交 Issue 或联系开发者。 