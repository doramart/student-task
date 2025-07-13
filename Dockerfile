# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 设置 pnpm 镜像源为国内源
RUN pnpm config set registry https://registry.npmmirror.com

# 依赖安装阶段
FROM base AS deps

# 复制 package.json
COPY server/package.json ./

# 安装依赖
RUN pnpm install --prod

# 应用构建阶段
FROM base AS app

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制应用程序代码（排除日志和开发文件）
COPY server/ ./

# 创建必要的目录并设置权限
RUN mkdir -p logs && \
    mkdir -p run && \
    chown -R appuser:nodejs /app/logs && \
    chown -R appuser:nodejs /app/run && \
    chown -R appuser:nodejs /app

# 复制并设置启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 7801

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7801/api/health || exit 1

# 启动应用
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "start"] 