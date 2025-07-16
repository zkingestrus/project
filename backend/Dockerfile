# 使用更兼容的 Debian 系镜像（默认带 openssl）
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock
COPY package*.json ./

# 生产环境阶段
FROM base AS production

# 安装 OpenSSL 1.1 兼容库（Prisma 依赖）
RUN apk add --no-cache openssl1.1-compat

# 使用国内镜像源加速依赖安装
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --only=production --prefer-offline --progress=false --no-audit

# 复制源代码
COPY . .

# 正确生成 Prisma 客户端（不加 --wasm）
RUN npx prisma generate

# 构建 TS
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
