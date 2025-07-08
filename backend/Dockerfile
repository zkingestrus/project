# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock
COPY package*.json ./

# 生产环境阶段
FROM base AS production

# 这里不再安装 openssl，直接设置 Prisma 引擎为 wasm
ENV NODE_ENV=production \
    PRISMA_CLIENT_ENGINE_TYPE=wasm

RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成 Prisma 客户端 (仅 wasm 引擎)
RUN npx prisma generate --wasm

# 构建 TS
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"] 