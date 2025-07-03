# 学生每日任务管理系统

基于现有 pnpm monorepo 架构的移动端优先任务管理平台，支持每日任务展示和历史回溯功能。

## 演示地址

[学生任务管理系统](https://student-task.micoai.cn)

## 🚀 技术栈

### 前端 (Client)

- **Vue 2.6** - 渐进式 JavaScript 框架
- **Vant 2.x** - 移动端 UI 组件库
- **Vue Router** - 路由管理
- **Vuex** - 状态管理
- **Axios** - HTTP 客户端
- **Day.js** - 轻量级日期处理库
- **lib-flexible + postcss-pxtorem** - 移动端适配方案

### 后端 (Server)

- **Egg.js 3.0** - 企业级 Node.js 框架
- **MongoDB + Mongoose** - 数据库解决方案
- **egg-mongoose** - Egg.js MongoDB 插件
- **egg-cors** - 跨域支持
- **egg-validate** - 参数验证
- **Day.js** - 日期处理

## 📱 功能特性

### 核心功能

- ✅ **每日任务管理** - 按科目（语文/数学/英语）创建和管理任务
- ✅ **任务状态追踪** - 未开始/进行中/已完成状态管理
- ✅ **历史任务回溯** - 支持查看任意历史日期的任务记录
- ✅ **日期快速切换** - 昨天/今天/明天导航，支持滑动手势
- ✅ **权限控制** - 历史任务只读，防止数据篡改

### 数据可视化

- 📊 **进度统计** - 科目级和总体完成率展示
- 📅 **日历视图** - 月度任务完成状态一览
- 📈 **趋势分析** - 历史完成率变化曲线
- 🔥 **连续记录** - 连续完成任务天数统计

### 移动端优化

- 📱 **触控友好** - 48px+ 触控目标，符合 WCAG 标准
- 🎨 **响应式设计** - REM 适配，支持多种屏幕尺寸
- ⚡ **性能优化** - 数据缓存，离线支持
- 🎯 **用户体验** - 骨架屏，加载状态，错误处理

## 📸 应用界面

### 主要功能界面

<div align="center">

#### 📋 任务列表管理

<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/任务列表.jpeg" alt="任务列表界面" width="300"/>

_支持任务创建、编辑、状态切换，以及按科目分类管理_

#### 🤖 AI 智能创建任务

<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/AI创建任务.jpeg" alt="AI创建任务界面" width="300"/>

_基于 AI 的智能任务创建，提供个性化学习建议_

#### 📅 任务日历视图

<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/任务日历.jpeg" alt="任务日历界面" width="300"/>

_月度日历视图，直观显示每日任务完成状态_

#### 📊 学习数据统计

<img src="https://raw.githubusercontent.com/doramart/student-task/master/docs/images/学习统计.jpeg" alt="学习统计界面" width="300"/>

_详细的学习数据分析，包括完成率、连续天数等统计_

</div>

## 🛠️ 开发环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **MongoDB** >= 4.4

## 📦 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/doramart/student-task.git
cd student-task
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行：

```bash
# macOS (使用 Homebrew)
brew services start mongodb/brew/mongodb-community

# 或直接启动
mongod --config /usr/local/etc/mongod.conf
```

### 4. 配置环境变量

**重要：** 为了安全起见，所有敏感配置信息都通过环境变量进行管理。

```bash
# 复制环境变量模板文件
cp server/env.example server/.env

# 编辑环境变量文件，填入你的实际配置
vim server/.env  # 或使用你喜欢的编辑器
```

必须配置的环境变量：

```bash
# 数据库配置
MONGODB_URL=mongodb://localhost:27017/student_task_db

# JWT 配置（生产环境必须设置强密钥）
JWT_SECRET=your-strong-jwt-secret-key-here

# 其他可选配置请参考 server/env.example 文件
```

**⚠️ 安全提醒：**

- 生产环境必须使用强密钥
- 不要在代码中硬编码敏感信息
- `.env` 文件已被 `.gitignore` 排除，不会被提交到版本控制

### 5. 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev

# 或分别启动
pnpm dev:server  # 后端服务 (端口 7801)
pnpm dev:client  # 前端服务 (端口 8080)
```

### 6. 访问应用

- **前端应用**: http://localhost:8080
- **后端 API**: http://localhost:7801
- **健康检查**: http://localhost:7801/api/health

## 📡 API 接口

### 任务管理

```
GET    /api/tasks                    # 获取指定日期的任务
POST   /api/tasks                    # 创建新任务
PATCH  /api/tasks/:id               # 更新任务
DELETE /api/tasks/:id               # 删除任务
```

### 数据分析

```
GET    /api/tasks/calendar          # 获取月度日历数据
GET    /api/tasks/stats             # 获取统计数据
GET    /api/tasks/streak            # 获取连续完成天数
PATCH  /api/tasks/batch             # 批量更新任务
```

## 🗂️ 项目结构

```
student-task/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── api/           # API 接口封装
│   │   ├── components/    # 可复用组件
│   │   ├── views/         # 页面组件
│   │   ├── store/         # Vuex 状态管理
│   │   ├── router/        # 路由配置
│   │   └── App.vue        # 根组件
│   ├── public/            # 静态资源
│   └── package.json
├── server/                # 后端应用
│   ├── app/
│   │   ├── controller/    # 控制器
│   │   ├── model/         # 数据模型
│   │   ├── middleware/    # 中间件
│   │   └── router.js      # 路由配置
│   ├── config/            # 配置文件
│   └── package.json
├── package.json           # 根 package.json
├── pnpm-workspace.yaml    # pnpm 工作空间配置
└── README.md
```

## 🎯 核心组件说明

### 前端组件

- **TaskBoard.vue** - 主任务面板，支持日期切换和任务管理
- **DateNavigator.vue** - 日期导航器，支持快速日期切换
- **TaskItem.vue** - 任务项组件，支持编辑和状态切换
- **Calendar.vue** - 任务日历视图
- **Statistics.vue** - 学习统计分析

### 后端模块

- **Task Model** - 任务数据模型，包含完整的索引和统计方法
- **Task Controller** - 任务控制器，处理所有任务相关的 API 请求
- **权限中间件** - 确保数据安全和操作权限控制

## 🔧 开发命令

```bash
# 开发环境
pnpm dev                    # 启动完整开发环境
pnpm dev:client            # 仅启动前端
pnpm dev:server            # 仅启动后端

# 构建
pnpm build                 # 构建所有项目
pnpm build:client          # 构建前端
pnpm build:server          # 构建后端

# 测试
pnpm test                  # 运行所有测试
pnpm test:client           # 前端测试
pnpm test:server           # 后端测试

# 代码检查
pnpm lint                  # 检查所有代码
pnpm lint:client           # 检查前端代码
pnpm lint:server           # 检查后端代码

# 清理
pnpm clean                 # 清理依赖和构建文件
pnpm fresh                 # 重新安装所有依赖
```

## 🔐 环境变量配置

### 必需的环境变量

| 变量名        | 描述               | 示例值                                      | 必需 |
| ------------- | ------------------ | ------------------------------------------- | ---- |
| `MONGODB_URL` | MongoDB 连接字符串 | `mongodb://localhost:27017/student_task_db` | ✅   |
| `JWT_SECRET`  | JWT 签名密钥       | `your-strong-secret-key`                    | ✅   |
| `API_TOKEN`   | API 访问令牌       | `your-api-token`                            | ✅   |

### 可选的环境变量

| 变量名             | 描述             | 默认值        | 用途      |
| ------------------ | ---------------- | ------------- | --------- |
| `PORT`             | 服务器端口       | `7801`        | 开发/部署 |
| `NODE_ENV`         | 运行环境         | `development` | 环境配置  |
| `MAIL_USER`        | 邮箱账号         | -             | 邮件服务  |
| `MAIL_PASS`        | 邮箱授权码       | -             | 邮件服务  |
| `QINIU_ACCESS_KEY` | 七牛云访问密钥   | -             | 文件存储  |
| `QINIU_SECRET_KEY` | 七牛云私钥       | -             | 文件存储  |
| `DOUBAO_API_KEY`   | 豆包 AI API 密钥 | -             | AI 功能   |

### 环境变量配置步骤

1. **复制模板文件**

   ```bash
   cp server/env.example server/.env
   ```

2. **编辑配置文件**

   ```bash
   # 使用你喜欢的编辑器
   nano server/.env
   # 或
   vim server/.env
   ```

3. **填入实际配置**

   ```bash
   # 数据库配置
   MONGODB_URL=mongodb://your-username:your-password@your-host:27017/your-database

   # JWT 配置
   JWT_SECRET=your-very-strong-and-long-secret-key-here

   # API Token
   API_TOKEN=your-generated-api-token
   ```

## 📊 数据库设计

### Task 集合结构

```javascript
{
  userId: ObjectId,           // 学生 ID
  date: ISODate,             // 任务日期
  subject: String,           // 科目名称 ['语文', '数学', '英语']
  title: String,             // 任务标题
  description: String,       // 任务描述
  isCompleted: Boolean,      // 完成状态
  deadline: ISODate,         // 截止时间
  completedAt: ISODate,      // 完成时间
  createdAt: ISODate,        // 创建时间
  updatedAt: ISODate         // 更新时间
}
```

### 索引策略

- `{ userId: 1, date: -1 }` - 用户日期查询
- `{ userId: 1, subject: 1, date: -1 }` - 科目查询
- `{ userId: 1, date: -1, isCompleted: 1 }` - 统计查询
- `{ userId: 1, completedAt: -1 }` - 连续天数统计

## 🚀 部署指南

### 生产环境部署

1. 构建应用

```bash
pnpm build
```

2. 配置环境变量

```bash
# server/config/config.prod.js
config.mongoose.client.url = 'mongodb://your-production-db/student_task_db'
```

3. 启动服务

```bash
pnpm start
```

### Docker 部署

```dockerfile
# 示例 Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build
EXPOSE 7801
CMD ["pnpm", "start"]
```

## 🐛 故障排除

### 常见问题

1. **MongoDB 连接失败**

   - 确保 MongoDB 服务正在运行
   - 检查连接字符串和端口配置

2. **前端页面无法访问后端**

   - 检查代理配置 `client/vue.config.js`
   - 确认 CORS 配置正确

3. **移动端样式问题**
   - 检查 postcss-pxtorem 配置
   - 确认 lib-flexible 正确引入

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请创建 Issue 或联系开发团队。

---

> **🎯 项目目标**: 通过直观的移动端界面和完整的数据追踪，帮助学生建立良好的学习习惯，提升学习效率。
