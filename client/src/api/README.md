# API 模块

## 概述

这个目录包含所有业务相关的 API 接口定义。每个文件对应一个业务模块，只关注业务逻辑，不处理公共的请求配置。

## 文件结构

```
client/src/api/
├── task.js          # 任务相关API
├── README.md        # 使用说明
└── ...              # 其他业务模块API
```

## 开发规范

### 1. 文件命名

- 使用小写字母和连字符：`user-profile.js`
- 或使用驼峰命名：`userProfile.js`
- 文件名应反映业务模块

### 2. 代码结构

```javascript
import request from "@/request";

// 业务模块API
export default {
  // 获取数据
  async getData(params) {
    const response = await request.get("/api/endpoint", { params });
    return response.data;
  },

  // 创建数据
  async createData(data) {
    const response = await request.post("/api/endpoint", data);
    return response.data;
  },

  // 更新数据
  async updateData(id, data) {
    const response = await request.patch(`/api/endpoint/${id}`, data);
    return response.data;
  },

  // 删除数据
  async deleteData(id) {
    const response = await request.delete(`/api/endpoint/${id}`);
    return response.data;
  },
};
```

### 3. 命名规范

- 方法名使用动词开头：`get`, `create`, `update`, `delete`
- 使用驼峰命名法：`getUserProfile`, `updateUserInfo`
- 保持一致性：同类操作使用相同的动词

### 4. 参数处理

```javascript
// GET请求 - 使用params
const response = await request.get("/api/users", {
  params: { page, size, keyword },
});

// POST/PATCH - 直接传递数据
const response = await request.post("/api/users", userData);

// 路径参数 - 使用模板字符串
const response = await request.get(`/api/users/${userId}`);
```

## 使用示例

### 1. 创建新的业务 API 文件

```javascript
// client/src/api/user.js
import request from "@/request";

export default {
  // 获取用户列表
  async getUsers(params = {}) {
    const response = await request.get("/users", { params });
    return response.data;
  },

  // 获取用户详情
  async getUserById(userId) {
    const response = await request.get(`/users/${userId}`);
    return response.data;
  },

  // 创建用户
  async createUser(userData) {
    const response = await request.post("/users", userData);
    return response.data;
  },

  // 更新用户信息
  async updateUser(userId, updates) {
    const response = await request.patch(`/users/${userId}`, updates);
    return response.data;
  },

  // 删除用户
  async deleteUser(userId) {
    const response = await request.delete(`/users/${userId}`);
    return response.data;
  },

  // 重置密码
  async resetPassword(userId, newPassword) {
    const response = await request.post(`/users/${userId}/reset-password`, {
      password: newPassword,
    });
    return response.data;
  },
};
```

### 2. 在组件中使用

```javascript
// 在Vue组件中使用
import userApi from "@/api/user";

export default {
  async created() {
    try {
      // 获取用户列表
      const users = await userApi.getUsers({ page: 1, size: 10 });
      this.userList = users;

      // 获取特定用户
      const user = await userApi.getUserById(123);
      this.currentUser = user;
    } catch (error) {
      // 错误处理已在request模块中统一处理
      // 这里可以添加特定的业务逻辑
      console.error("加载用户数据失败:", error);
    }
  },

  methods: {
    async handleCreateUser(userData) {
      try {
        await userApi.createUser(userData);
        // 创建成功，刷新列表
        await this.loadUsers();
      } catch (error) {
        // 错误已自动显示Toast提示
      }
    },

    async handleUpdateUser(userId, updates) {
      try {
        await userApi.updateUser(userId, updates);
        // 更新成功处理
      } catch (error) {
        // 错误处理
      }
    },
  },
};
```

## 最佳实践

### 1. 错误处理

- 公共错误处理已在 request 模块中实现
- 业务 API 只需要关注业务逻辑
- 特殊错误可在组件中单独处理

### 2. Loading 管理

- 全局 loading 已自动管理
- 无需在 API 层面处理 loading 状态
- 组件中可使用局部 loading 处理特定场景

### 3. 数据转换

```javascript
// 如需要数据转换，在API层面处理
async getUsers(params = {}) {
  const response = await request.get("/users", { params });

  // 数据转换
  const users = response.data.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    isActive: user.status === 'active'
  }));

  return users;
}
```

### 4. 缓存处理

```javascript
// 可在API层面添加简单缓存
const cache = new Map();

export default {
  async getUserById(userId) {
    // 检查缓存
    if (cache.has(userId)) {
      return cache.get(userId);
    }

    const response = await request.get(`/users/${userId}`);
    const user = response.data;

    // 缓存结果
    cache.set(userId, user);
    return user;
  },
};
```

## 注意事项

1. **不要**在 API 文件中处理 loading 状态
2. **不要**在 API 文件中显示 Toast 提示
3. **不要**在 API 文件中配置 axios 实例
4. **确保**所有方法都返回 Promise
5. **确保**错误能正确向上传播

---

**参考文件**：`client/src/api/task.js`
**公共模块**：`client/src/request/index.js`
