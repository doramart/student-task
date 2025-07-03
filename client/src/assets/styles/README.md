# Less 样式指南

本项目已配置 Less 预处理器支持，可以使用 Less 的所有功能来编写更强大和灵活的样式。

## 特性支持

### ✅ 已支持的功能

- **变量 (Variables)**: 使用 `@` 符号定义和使用变量
- **嵌套 (Nesting)**: 支持 CSS 选择器嵌套
- **混合 (Mixins)**: 可重用的样式代码块
- **函数 (Functions)**: 内置的颜色、数学等函数
- **运算 (Operations)**: 支持数学运算
- **导入 (Imports)**: 可以导入其他 Less 文件
- **全局变量**: 自动导入全局变量文件

## 文件结构

```
src/assets/styles/
├── variables.less      # 全局变量定义
└── README.md          # 本说明文档
```

## 使用方法

### 1. 在 Vue 组件中使用

在 `<style>` 标签中添加 `lang="less"` 属性：

```vue
<style lang="less" scoped>
.my-component {
  color: @primary-color;

  .nested-element {
    background-color: @background-color-base;
  }
}
</style>
```

### 2. 使用全局变量

所有全局变量已自动导入，可以直接使用：

```less
.example {
  color: @text-color;
  background: @background-color-light;
  border-radius: @border-radius-base;
}
```

### 3. 使用混合函数

定义混合函数：

```less
.button-style(@bg-color, @text-color) {
  background-color: @bg-color;
  color: @text-color;
  padding: 8px 16px;
  border-radius: @border-radius-base;
}
```

使用混合函数：

```less
.my-button {
  .button-style(@primary-color, @text-color-inverse);
}
```

### 4. 嵌套和伪选择器

```less
.navigation {
  ul {
    list-style: none;

    li {
      display: inline-block;

      a {
        text-decoration: none;
        color: @text-color;

        &:hover {
          color: @primary-color;
        }

        &.active {
          color: @primary-color;
          font-weight: bold;
        }
      }
    }
  }
}
```

### 5. 使用内置函数

```less
.example {
  // 颜色函数
  background-color: lighten(@primary-color, 20%);
  border-color: darken(@primary-color, 10%);

  // 数学函数
  width: percentage(2/3);
  margin: ceil(10.5px);
}
```

## 全局变量说明

### 主题色彩

- `@primary-color`: 主要颜色
- `@success-color`: 成功颜色
- `@warning-color`: 警告颜色
- `@error-color`: 错误颜色
- `@info-color`: 信息颜色

### 文本颜色

- `@text-color`: 主要文本颜色
- `@text-color-secondary`: 次要文本颜色
- `@text-color-inverse`: 反色文本（白色）

### 背景和边框

- `@background-color-base`: 基础背景色
- `@background-color-light`: 浅色背景
- `@border-color-base`: 基础边框色
- `@border-color-light`: 浅色边框

### 尺寸和布局

- `@border-radius-base`: 基础圆角
- `@border-radius-sm`: 小号圆角
- `@font-size-base`: 基础字体大小
- `@font-size-lg`: 大号字体
- `@font-size-sm`: 小号字体

### 响应式断点

- `@screen-xs`: 480px
- `@screen-sm`: 576px
- `@screen-md`: 768px
- `@screen-lg`: 992px
- `@screen-xl`: 1200px
- `@screen-xxl`: 1600px

## 最佳实践

### 1. 使用语义化变量名

```less
// ✅ 好的做法
@header-background: @primary-color;
@sidebar-width: 240px;

// ❌ 避免的做法
@color1: #1890ff;
@size1: 240px;
```

### 2. 合理使用嵌套

```less
// ✅ 合理的嵌套（不超过3层）
.card {
  .card-header {
    .card-title {
      font-weight: bold;
    }
  }
}

// ❌ 过度嵌套
.page .container .content .section .card .header .title {
  // 太深的嵌套难以维护
}
```

### 3. 提取公共混合函数

```less
// 定义可重用的混合
.flex-center() {
  display: flex;
  align-items: center;
  justify-content: center;
}

.truncate-text() {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 在组件中使用
.my-component {
  .flex-center();

  .title {
    .truncate-text();
  }
}
```

### 4. 使用条件和循环

```less
// 条件判断
.button(@type: default) when (@type = primary) {
  background-color: @primary-color;
  color: @text-color-inverse;
}

.button(@type: default) when (@type = secondary) {
  background-color: transparent;
  color: @primary-color;
  border: 1px solid @primary-color;
}

// 循环生成样式
.generate-spacing(@n, @i: 1) when (@i =< @n) {
  .m-@{i} {
    margin: (@i * 4px);
  }
  .p-@{i} {
    padding: (@i * 4px);
  }
  .generate-spacing(@n, (@i + 1));
}

.generate-spacing(10);
```

## 调试技巧

1. **使用浏览器开发者工具**: 可以看到编译后的 CSS
2. **注释调试**: 使用 `/* */` 而不是 `//` 用于需要在 CSS 中保留的注释
3. **变量验证**: 可以通过 `content: "@{variable-name}";` 输出变量值

## 示例组件

参考 `src/components/LessExample.vue` 组件，了解完整的 Less 使用示例。
