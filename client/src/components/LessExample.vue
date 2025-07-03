<template>
  <div class="less-example">
    <h3 class="title">Less 样式示例</h3>
    <div class="card">
      <div class="card-header">
        <span class="card-title">功能演示</span>
      </div>
      <div class="card-body">
        <p class="description">这是一个使用 Less 预处理器的示例组件</p>
        <div class="button-group">
          <button class="btn btn-primary">主要按钮</button>
          <button class="btn btn-success">成功按钮</button>
          <button class="btn btn-warning">警告按钮</button>
          <button class="btn btn-error">错误按钮</button>
        </div>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon primary"></div>
            <span>支持变量</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon success"></div>
            <span>支持嵌套</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon warning"></div>
            <span>支持函数</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon error"></div>
            <span>支持混合</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LessExample",
  data() {
    return {
      message: "Less 预处理器已成功配置！",
    };
  },
};
</script>

<style lang="less" scoped>
// 混合函数示例
.button-style(@bg-color, @hover-color) {
  background-color: @bg-color;
  color: @text-color-inverse;
  border: none;
  padding: 8px 16px;
  border-radius: @border-radius-sm;
  cursor: pointer;
  font-size: @font-size-base;
  transition: all 0.3s ease;

  &:hover {
    background-color: @hover-color;
    transform: translateY(-2px);
    box-shadow: @shadow-float;
  }
}

.less-example {
  padding: 20px;
  background-color: @background-dark;
  min-height: 100vh;

  .title {
    color: @text-color;
    font-size: @font-size-lg * 1.5;
    margin-bottom: 20px;
    text-align: center;
  }

  .card {
    background: white;
    border-radius: @border-radius-sm;
    box-shadow: @shadow-card;
    overflow: hidden;
    max-width: 600px;
    margin: 0 auto;

    .card-header {
      background-color: @primary-color;
      color: @text-color-inverse;
      padding: 16px 20px;

      .card-title {
        font-size: @font-size-lg;
        font-weight: bold;
      }
    }

    .card-body {
      padding: 24px 20px;

      .description {
        color: @text-color-secondary;
        font-size: @font-size-base;
        margin-bottom: 20px;
        line-height: @line-height-base;
      }

      .button-group {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;

        .btn {
          &.btn-primary {
            .button-style(@primary-color, darken(@primary-color, 10%));
          }

          &.btn-success {
            .button-style(@success-color, darken(@success-color, 10%));
          }

          &.btn-warning {
            .button-style(@warning-color, darken(@warning-color, 10%));
          }

          &.btn-error {
            .button-style(@error-color, darken(@error-color, 10%));
          }
        }
      }

      .feature-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;

        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background-color: @background-color-base;
          border-radius: @border-radius-sm;
          transition: all 0.2s ease;

          &:hover {
            background-color: darken(@background-color-base, 5%);
          }

          .feature-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;

            &.primary {
              background-color: @primary-color;
            }

            &.success {
              background-color: @success-color;
            }

            &.warning {
              background-color: @warning-color;
            }

            &.error {
              background-color: @error-color;
            }
          }

          span {
            font-size: @font-size-sm;
            color: @text-color;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: @screen-sm) {
  .less-example {
    padding: 10px;

    .card {
      .card-body {
        padding: 16px;

        .button-group {
          .btn {
            flex: 1;
            min-width: 80px;
          }
        }

        .feature-list {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style>
