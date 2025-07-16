# ✅ 使用更兼容的镜像（基于 Debian，含 OpenSSL）
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 拷贝依赖定义
COPY package*.json ./

# 使用国内源加速，并安装依赖
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --only=production --prefer-offline --progress=false --no-audit

# 拷贝源码
COPY . .

# 生成 Prisma 客户端（❌ 不要加 --wasm）
RUN npx prisma generate

# 编译 TypeScript
RUN npm run build

# 开放端口
EXPOSE 3001

# 启动服务
CMD ["npm", "start"]
