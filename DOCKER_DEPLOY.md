# Docker 一键部署指南

## 📋 部署概述

学生任务管理系统已成功推送到 Docker Hub，现在可以通过 Docker Compose 进行一键部署。

## 🚀 快速开始

### 1. 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 2. 一键部署

```bash
# 克隆项目（如果还没有）
git clone https://github.com/doramart/student-task.git
cd student-task

# 运行一键部署脚本
./deploy.sh
```

### 3. 手动部署

```bash
# 1. 复制环境变量模板
cp docker.env.example docker.env

# 2. 编辑环境变量（重要！）
vim docker.env

# 3. 启动服务
docker-compose --env-file docker.env up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

## ⚙️ 环境变量配置

### 必需配置

编辑 `docker.env` 文件，设置以下必需参数：

```bash
# JWT 密钥（必须修改为强密钥）
JWT_SECRET=your-very-strong-jwt-secret-key-here

# MongoDB 密码（建议修改）
MONGO_ROOT_PASSWORD=your-strong-mongodb-password

# 应用密钥（建议修改）
APP_KEYS=student-task_$(date +%s)_1000
```

### 可选配置

```bash
# 邮件服务（可选）
MAIL_SERVICE=smtp.qq.com
MAIL_PORT=465
MAIL_USER=your_email@qq.com
MAIL_PASS=your_email_auth_code
MAIL_FROM=学生任务管理系统 <your_email@qq.com>

# 端口配置
APP_PORT=7801
MONGO_PORT=27017
NGINX_PORT=80
```

## 📊 服务架构

部署后包含以下服务：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │───▶│  App (7801)     │───▶│  MongoDB (27017)│
│   (可选)        │    │  (主应用)       │    │  (数据库)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 服务说明

- **student-task-app**: 主应用服务（Egg.js + Vue）
- **mongodb**: MongoDB 数据库服务
- **nginx**: Nginx 反向代理（可选）

## 🔍 访问地址

部署成功后，可通过以下地址访问：

- **主应用**: http://localhost:7801
- **API 接口**: http://localhost:7801/api
- **健康检查**: http://localhost:7801/api/health
- **MongoDB**: localhost:27017

## 👤 默认账户

系统会自动创建默认用户：

- **邮箱**: demo@student-task.com
- **示例任务**: 已预置语文、数学、英语三个科目的示例任务

## 🛠️ 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f student-task-app  # 只看应用日志
docker-compose logs -f mongodb          # 只看数据库日志

# 进入容器
docker-compose exec student-task-app sh
docker-compose exec mongodb mongosh

# 备份数据库
docker-compose exec mongodb mongodump --out /data/backup

# 恢复数据库
docker-compose exec mongodb mongorestore /data/backup
```

## 🔧 高级配置

### 使用 Nginx 反向代理

```bash
# 启动包含 Nginx 的完整服务
docker-compose --profile with-nginx up -d
```

### 自定义端口

修改 `docker.env` 文件中的端口配置：

```bash
APP_PORT=8080      # 应用端口
MONGO_PORT=27018   # MongoDB 端口
NGINX_PORT=8080    # Nginx 端口
```

### 数据持久化

数据会自动持久化到 Docker volumes：

- `mongodb_data`: MongoDB 数据
- `app_logs`: 应用日志
- `app_uploads`: 上传文件

## 🔒 安全建议

1. **修改默认密码**：

   - 修改 `JWT_SECRET` 为强密钥
   - 修改 `MONGO_ROOT_PASSWORD` 为强密码

2. **生产环境配置**：

   - 使用 HTTPS
   - 配置防火墙
   - 定期备份数据
   - 监控系统资源

3. **网络安全**：
   - 不要暴露 MongoDB 端口到公网
   - 使用强密码
   - 定期更新镜像

## 🐛 故障排除

### 常见问题

1. **服务启动失败**

   ```bash
   # 查看详细日志
   docker-compose logs

   # 检查端口占用
   netstat -tlnp | grep 7801
   ```

2. **数据库连接失败**

   ```bash
   # 检查 MongoDB 状态
   docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
   ```

3. **应用无法访问**
   ```bash
   # 检查应用健康状态
   curl http://localhost:7801/api/health
   ```

### 日志位置

- **应用日志**: `docker-compose logs -f student-task-app`
- **数据库日志**: `docker-compose logs -f mongodb`
- **Nginx 日志**: `docker-compose logs -f nginx`

## 📈 监控和维护

### 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
docker system df
```

### 备份策略

```bash
# 备份数据库
docker-compose exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# 备份配置文件
tar -czf backup-$(date +%Y%m%d).tar.gz docker.env docker-compose.yml
```

### 更新部署

```bash
# 拉取最新镜像
docker pull doramart/student-task:latest

# 重启服务
docker-compose restart student-task-app
```

## 📞 技术支持

如果遇到问题，请：

1. 查看日志：`docker-compose logs -f`
2. 检查配置：确认环境变量设置正确
3. 提交 Issue：https://github.com/doramart/student-task/issues

---

**注意**: 生产环境部署前，请务必修改所有默认密码和密钥！
