# 学生每日任务看板

基于 Vue + Egg.js 的移动端优先任务管理平台，支持每日任务展示和历史回溯功能。

## 🌐 在线演示

[学生任务看板](https://student-task.micoai.cn)

## 🚀 快速开始

### 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/doramart/student-task.git
cd student-task

# 一键部署
./deploy.sh

# 访问应用: http://localhost:7801
```

### 手动部署

```bash
# 1. 配置环境变量
cp docker.env.example docker.env
vim docker.env  # 设置 JWT_SECRET

# 2. 启动服务
docker-compose --env-file docker.env up -d

# 3. 访问应用: http://localhost:7801
```

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问应用
# 前端: http://localhost:8080
# 后端: http://localhost:7801
```

## 📱 功能特性

- ✅ **每日任务管理** - 按科目（语文/数学/英语）创建和管理任务
- ✅ **任务状态追踪** - 未开始/进行中/已完成状态管理
- ✅ **历史任务回溯** - 支持查看任意历史日期的任务记录
- ✅ **数据可视化** - 进度统计、日历视图、趋势分析
- ✅ **移动端优化** - 响应式设计，触控友好

## 🛠️ 技术栈

### 前端

- Vue 2.6 + Vant 2.x + Vue Router + Vuex
- 移动端适配：lib-flexible + postcss-pxtorem

### 后端

- Egg.js 3.0 + MongoDB + Mongoose
- JWT 认证 + CORS 支持

## 📸 应用界面

<div align="center">

<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/任务列表.jpeg" alt="任务列表界面" width="300"/>
<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/任务日历.jpeg" alt="任务日历界面" width="300"/>
<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/学习统计.jpeg" alt="学习统计界面" width="300"/>

</div>

## 🔧 常用命令

```bash
# 开发环境
pnpm dev                    # 启动完整开发环境
pnpm dev:client            # 仅启动前端
pnpm dev:server            # 仅启动后端

# Docker 部署
docker-compose up -d        # 启动服务
docker-compose down         # 停止服务
docker-compose logs -f      # 查看日志

# 构建
pnpm build                 # 构建所有项目
```

## 🔐 环境变量

必需的环境变量：

```bash
# JWT 密钥（必须修改为强密钥）
JWT_SECRET=your-very-strong-jwt-secret-key-here

# MongoDB 密码（建议修改）
MONGO_ROOT_PASSWORD=your-strong-mongodb-password
```

## 🐛 故障排除

### 常见问题

1. **服务启动失败**

   ```bash
   docker-compose logs -f  # 查看详细日志
   ```

2. **数据库连接失败**

   ```bash
   docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
   ```

3. **应用无法访问**
   ```bash
   curl http://localhost:7801/api/health
   ```

## 📞 支持

如有问题或建议，请创建 [Issue](https://github.com/doramart/student-task/issues)。

---

> **�� 项目目标**: 通过直观的移动端界面和完整的数据追踪，帮助学生建立良好的学习习惯，提升学习效率。
