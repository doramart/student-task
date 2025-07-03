# Egg.js RESTful API 脚手架

基于 Egg.js 框架的轻量级 RESTful API 脚手架项目，提供完整的身份验证、参数验证、错误处理等功能。

## 技术栈

- **Node.js** - 最新 LTS 版本
- **Egg.js** - 最新稳定版本
- **egg-cors** - 跨域处理
- **egg-validate** - 参数验证
- **request-promise-native** - HTTP 请求封装

## 功能特性

- ✅ 简单身份验证（Bearer Token）
- ✅ 严格遵循 RESTful API 设计规范
- ✅ 统一的响应格式封装
- ✅ 完善的错误处理机制
- ✅ 请求参数验证
- ✅ 跨域支持
- ✅ 代码风格统一（ESLint）
- ✅ 热重载开发环境
- ✅ 分环境日志配置
- ✅ PM2 部署配置

## 项目结构

```
├── app/
│   ├── controller/          # 控制器
│   │   ├── auth.js         # 认证相关
│   │   ├── user.js         # 用户管理
│   │   ├── article.js      # 文章管理
│   │   ├── custom.js       # 自定义接口
│   │   └── health.js       # 健康检查
│   ├── extend/             # 扩展
│   │   ├── helper.js       # Helper 扩展
│   │   └── request.js      # Request 扩展
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 身份验证
│   │   └── errorHandler.js # 错误处理
│   └── router.js           # 路由配置
├── config/
│   ├── config.default.js   # 默认配置
│   ├── config.local.js     # 本地开发配置
│   ├── config.prod.js      # 生产环境配置
│   └── plugin.js           # 插件配置
├── app.js                  # 应用入口
├── package.json            # 项目依赖
├── ecosystem.config.js     # PM2 配置
├── .eslintrc              # ESLint 配置
├── .gitignore             # Git 忽略文件
└── env.example            # 环境变量示例
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp env.example .env
```

根据需要修改 `.env` 文件中的配置。

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:7801` 启动。

### 4. 验证安装

访问健康检查接口：

```bash
curl http://localhost:7801/api/health
```

## API 文档

### 认证

所有需要认证的接口都需要在请求头中携带 Bearer Token：

```
Authorization: Bearer your-token-here
```

默认开发环境 Token: `dev-token-123456`

### 接口列表

#### 健康检查

- `GET /api/health` - 健康检查（无需认证）

#### 认证相关

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

#### 用户管理（RESTful）

- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

#### 文章管理（RESTful）

- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取单篇文章
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

#### 自定义接口

- `GET /api/custom/example` - 示例接口
- `POST /api/custom/upload` - 文件上传示例
- `GET /api/custom/download/:id` - 文件下载示例

### 响应格式

#### 成功响应

```json
{
  "code": 200,
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### 错误响应

```json
{
  "code": 400,
  "success": false,
  "message": "Error message",
  "data": null,
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### 分页响应

```json
{
  "code": 200,
  "success": true,
  "message": "Success",
  "data": {
    "list": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## 接口示例

### 登录

```bash
curl -X POST http://localhost:7801/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

### 获取用户列表

```bash
curl -X GET "http://localhost:7801/api/users?page=1&pageSize=10" \
  -H "Authorization: Bearer dev-token-123456"
```

### 创建用户

```bash
curl -X POST http://localhost:7801/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123456" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "123456",
    "status": "active"
  }'
```

### 创建文章

```bash
curl -X POST http://localhost:7801/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123456" \
  -d '{
    "title": "我的第一篇文章",
    "content": "这是文章的详细内容...",
    "category": "tech",
    "status": "published",
    "tags": ["Node.js", "Egg.js"]
  }'
```

## 开发指南

### 代码风格

项目使用 ESLint 进行代码风格检查：

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint -- --fix
```

### 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run cov
```

### 添加新的 API 接口

1. 在 `app/controller/` 目录下创建或修改控制器文件
2. 在 `app/router.js` 中添加路由配置
3. 如需要，添加参数验证规则
4. 更新 API 文档

### 中间件开发

在 `app/middleware/` 目录下创建中间件文件，然后在 `config/config.default.js` 中配置启用。

### 扩展开发

- Helper 扩展：`app/extend/helper.js`
- Request 扩展：`app/extend/request.js`
- Response 扩展：`app/extend/response.js`
- Context 扩展：`app/extend/context.js`

## 部署

### 使用 PM2 部署

1. 安装 PM2：

```bash
npm install -g pm2
```

2. 修改 `ecosystem.config.js` 中的配置

3. 启动应用：

```bash
pm2 start ecosystem.config.js --env production
```

4. 其他 PM2 命令：

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart eggjs-restful-scaffold

# 停止应用
pm2 stop eggjs-restful-scaffold

# 删除应用
pm2 delete eggjs-restful-scaffold
```

### 环境变量

生产环境需要设置以下环境变量：

- `NODE_ENV=production`
- `API_TOKEN=your-production-token`
- 其他根据需要配置的变量

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 7801

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t eggjs-restful-scaffold .
docker run -p 7801:7801 -e NODE_ENV=production eggjs-restful-scaffold
```

## 常见问题

### Q: 如何修改默认端口？

A: 在环境变量中设置 `PORT=your-port` 或修改配置文件。

### Q: 如何添加数据库支持？

A: 安装对应的 Egg.js 数据库插件（如 egg-mysql、egg-mongoose），然后在配置文件中进行配置。

### Q: 如何自定义错误处理？

A: 修改 `app/middleware/errorHandler.js` 文件中的错误处理逻辑。

### Q: 如何添加更多的身份验证方式？

A: 修改 `app/middleware/auth.js` 文件，支持 JWT、Session 等其他认证方式。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License
