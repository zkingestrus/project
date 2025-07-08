# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 生产环境
FROM base AS production
# 安装 OpenSSL 1.1 兼容库，解决 Prisma 运行时依赖问题
RUN apk add --no-cache openssl1.1-compat
ENV NODE_ENV=production
# 安装生产依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"] 