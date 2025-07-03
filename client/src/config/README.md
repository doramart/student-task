# 科目配置统一管理

本目录包含应用中所有科目相关的配置信息，用于统一管理科目列表、颜色、图标等信息。

## 文件结构

```
config/
├── subjects.js     # 科目配置主文件
└── README.md      # 使用说明文档
```

## 使用方式

### 1. 直接导入使用

```javascript
import { getSubjectColor, getSubjectIcon, SUBJECTS } from "@/config/subjects";

// 获取科目颜色
const color = getSubjectColor("语文"); // #ff6b6b

// 获取科目图标
const icon = getSubjectIcon("数学"); // calculator-o

// 获取所有科目列表
console.log(SUBJECTS); // ['语文', '数学', '英语', ...]
```

### 2. 使用全局 Mixin（推荐）

由于已经在 `main.js` 中全局注册了 `subjectMixin`，所有组件都可以直接使用科目相关方法：

```vue
<template>
  <div>
    <!-- 直接使用方法 -->
    <van-tag :color="getSubjectColor(task.subject)">
      {{ task.subject }}
    </van-tag>

    <!-- 使用计算属性 -->
    <div v-for="subject in allSubjects" :key="subject">
      {{ subject }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      task: { subject: "语文" },
    };
  },
  // 无需导入，直接使用全局mixin中的方法
  methods: {
    handleSubject() {
      // 可以直接调用 this.getSubjectColor()
      const color = this.getSubjectColor("数学");
      console.log(color);
    },
  },
};
</script>
```

### 3. 可用的方法和属性

#### 方法 (Methods)

- `getSubjectColor(subject)` - 获取科目颜色
- `getSubjectIcon(subject)` - 获取科目图标
- `getSubjectConfig(subject)` - 获取科目完整配置
- `isValidSubject(subject)` - 验证科目是否有效
- `formatSubjectName(subject)` - 格式化科目名称
- `getSubjectStyle(subject)` - 获取科目样式对象
- `getSubjectTagStyle(subject)` - 获取科目标签样式

#### 计算属性 (Computed)

- `allSubjects` - 所有科目列表
- `subjectColorMap` - 科目颜色映射对象
- `subjectIconMap` - 科目图标映射对象

## 配置说明

### 科目列表 (SUBJECTS)

当前支持的科目：

- 语文、数学、英语（核心学科）
- 舞蹈、运动（体艺类）
- 阅读、编程（技能类）
- 习惯养成、其他（生活类）

### 颜色配置 (SUBJECT_COLORS)

每个科目都有对应的主题色：

- 语文: `#ff6b6b` (红色系)
- 数学: `#4ecdc4` (青色系)
- 英语: `#45b7d1` (蓝色系)
- 舞蹈: `#ff9ff3` (粉色系)
- 运动: `#54a0ff` (蓝色系)
- 阅读: `#5f27cd` (紫色系)
- 编程: `#00d2d3` (青色系)
- 习惯养成: `#ff9f43` (橙色系)
- 其他: `#c7ecee` (浅青色)

### 图标配置 (SUBJECT_ICONS)

使用 Vant 图标库：

- 语文: `edit` (编辑图标)
- 数学: `calculator-o` (计算器图标)
- 英语: `chat-o` (聊天图标)
- 舞蹈: `music-o` (音乐图标)
- 运动: `play` (播放图标)
- 阅读: `bookmark-o` (书签图标)
- 编程: `desktop-o` (桌面图标)
- 习惯养成: `clock-o` (时钟图标)
- 其他: `bookmark` (书签图标)

## 最佳实践

### 1. 添加新科目

在 `subjects.js` 中添加新科目时，请确保：

- 在 `SUBJECTS` 数组中添加科目名称
- 在 `SUBJECT_COLORS` 中配置对应颜色
- 在 `SUBJECT_ICONS` 中配置对应图标
- 保持与服务端科目枚举的一致性

### 2. 颜色选择原则

- 使用有意义的颜色关联（如语文用红色，数学用理性的青色）
- 确保颜色对比度足够，保证可读性
- 避免使用过于相似的颜色
- 考虑色盲用户的体验

### 3. 图标选择原则

- 选择与科目内容相关的图标
- 保持图标风格统一（都使用 Vant 图标库）
- 确保图标在不同尺寸下都能清晰显示

### 4. 服务端同步

修改科目配置时，请确保：

- 与服务端 `server/app/model/task.js` 中的枚举值保持一致
- 更新相关的验证逻辑
- 测试新旧数据的兼容性

## 迁移指南

如果你的组件中有硬编码的科目相关代码，请按以下步骤迁移：

### 迁移前：

```javascript
// 不推荐：硬编码
methods: {
  getSubjectColor(subject) {
    const colorMap = {
      语文: "#ff6b6b",
      数学: "#4ecdc4",
      英语: "#45b7d1",
    };
    return colorMap[subject] || "#1989fa";
  }
}
```

### 迁移后：

```javascript
// 推荐：使用统一配置
import { getSubjectColor } from '@/config/subjects';

methods: {
  getSubjectColor, // 直接引用
}

// 或者直接使用全局mixin（无需导入）
// this.getSubjectColor(subject)
```

## 注意事项

1. **向后兼容性**：添加新科目时要考虑现有数据的兼容性
2. **性能考虑**：全局 mixin 会在所有组件中注入，如果某些组件不需要科目功能，可以考虑按需导入
3. **类型安全**：建议在 TypeScript 项目中为科目类型添加类型定义
4. **测试覆盖**：修改科目配置后要进行充分的测试，确保所有相关功能正常工作
