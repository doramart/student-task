# Request 模块

## 概述

这个模块负责处理所有 HTTP 请求的公共逻辑，包括：

- Axios 实例配置
- 请求/响应拦截器
- Loading 状态管理
- 错误处理
- Toast 提示

## 文件结构

```
client/src/request/
├── index.js          # 主要的请求配置和拦截器
└── README.md         # 说明文档
```

## 主要功能

### 1. 基础配置

- **Base URL**: 根据环境自动配置 API 地址
- **超时设置**: 10 秒请求超时
- **默认 Headers**: Content-Type 为 application/json

### 2. Loading 管理

- **智能延迟**: 200ms 延迟显示，避免快速请求闪现
- **最小时间**: 500ms 最小显示时间，避免闪烁
- **超时保护**: 15 秒强制隐藏，防止卡死
- **状态同步**: 确保 loading 状态与实际请求状态一致

### 3. 错误处理

- **HTTP 状态码**: 400/401/403/404/500 等标准错误处理
- **网络错误**: 连接失败、超时等网络问题处理
- **业务错误**: 根据 response.data.success 判断业务成功失败
- **用户提示**: 自动显示错误 Toast 提示

### 4. 工具方法

- `resetLoading()`: 强制重置 loading 状态（开发环境）
- `showToast()`: 延迟显示 Toast，避免与 loading 冲突
- `getBaseURL()`: 获取当前 API 基础地址

## 使用方法

### 基本使用

```javascript
import request from "@/request";

// GET请求
const response = await request.get("/api/endpoint");

// POST请求
const response = await request.post("/api/endpoint", data);

// 其他HTTP方法
const response = await request.patch("/api/endpoint", data);
const response = await request.delete("/api/endpoint");
```

### 导入工具方法

```javascript
import request, { resetLoading, showToast } from "@/request";

// 强制重置loading（开发环境）
resetLoading();

// 显示提示
showToast("success", "操作成功");
showToast("fail", "操作失败");
```

## 环境配置

### 开发环境

- 默认 API 地址: `http://127.0.0.1:7801/api`
- 可通过 `VUE_APP_API_BASE_URL` 环境变量自定义

### 生产环境

- API 地址: `/api`（相对路径）

## 调试功能

开发环境下提供以下调试功能：

- `window.resetLoading()`: 紧急重置 loading 状态
- 详细的错误日志输出
- 请求状态追踪

## 扩展指南

### 添加新的拦截器

```javascript
// 在index.js中添加
request.interceptors.request.use((config) => {
  // 新的请求处理逻辑
  return config;
});
```

### 自定义错误处理

```javascript
// 在响应拦截器中扩展错误处理
if (error.response?.status === 403) {
  // 处理权限错误
  router.push("/login");
}
```

### 添加认证支持

```javascript
// 在请求拦截器中添加token
config.headers.Authorization = `Bearer ${getToken()}`;
```
