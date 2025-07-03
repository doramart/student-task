<template>
  <div id="app" :class="{ 'with-tabbar': showTabbar }">
    <!-- 主内容区域 -->
    <router-view />

    <!-- 底部导航栏 -->
    <van-tabbar
      v-if="showTabbar"
      v-model="activeTab"
      @change="onTabChange"
      fixed
    >
      <van-tabbar-item icon="calendar-o" name="tasks">
        今日任务
      </van-tabbar-item>
      <van-tabbar-item icon="apps-o" name="calendar">
        任务日历
      </van-tabbar-item>
      <van-tabbar-item icon="chart-trending-o" name="stats">
        学习统计
      </van-tabbar-item>
    </van-tabbar>

    <!-- 全局 Loading 遮罩 -->
    <van-overlay :show="$store.state.loading" class="global-loading-overlay">
      <div class="global-loading-content">
        <van-loading color="#1989fa" size="50px" text-color="#1989fa" vertical>
          请稍候...
        </van-loading>
      </div>
    </van-overlay>

    <!-- PWA 安装提示 -->
    <PWAInstallPrompt />

    <!-- PWA更新管理器 - 仅在生产环境显示 -->
    <PWAUpdateManager v-if="$isProduction" />
  </div>
</template>

<script>
import PWAUpdateManager from "@/components/PWAUpdateManager.vue";

export default {
  name: "App",
  components: {
    PWAUpdateManager,
  },
  data() {
    return {
      activeTab: "tasks",
    };
  },

  computed: {
    // 控制底部导航栏的显示
    showTabbar() {
      // 在 chatbot、login 和 accept-invitation 页面隐藏底部导航栏
      const hiddenPaths = ["/chatbot", "/login", "/accept-invitation"];
      return !hiddenPaths.includes(this.$route.path);
    },
    $isProduction() {
      return process.env.NODE_ENV === "production";
    },
  },

  async created() {
    // 初始化应用
    try {
      await this.$store.dispatch("initApp");
    } catch (error) {
      console.error("App initialization failed:", error);
    }
  },

  methods: {
    onTabChange(name) {
      const routeMap = {
        tasks: "/tasks",
        calendar: "/calendar",
        stats: "/stats",
      };

      if (this.$route.path !== routeMap[name]) {
        this.$router.push(routeMap[name]);
      }
    },
  },

  watch: {
    $route(to) {
      // 根据路由更新底部导航
      if (to.path.startsWith("/tasks")) {
        this.activeTab = "tasks";
      } else if (to.path === "/calendar") {
        this.activeTab = "calendar";
      } else if (to.path === "/stats") {
        this.activeTab = "stats";
      }
    },
  },
};
</script>

<style lang="less">
/* Pay Wallet Style Guide - Global Styles */

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  background-color: @background-dark;
  font-family: @font-family-base;
  font-size: @font-size-base;
  line-height: @line-height-base;
  color: @text-color;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  background: @background-dark;

  &.with-tabbar {
    padding-bottom: @layout-footer-height;
  }
}

/* 现代化导航栏样式 */
.van-nav-bar {
  background: @card-gradient-bg;
  box-shadow: @shadow-soft;
  border: none;

  &__title {
    color: @text-color-inverse;
    font-weight: @font-weight-semibold;
    font-size: @font-size-lg;
  }

  .van-icon {
    color: @text-color-inverse;
    font-size: 18px;
  }

  &__arrow {
    color: @text-color-inverse;
  }
}

/* 现代化底部导航栏 */
.van-tabbar {
  background: @nav-background;
  box-shadow: @shadow-soft;
  border-top: none;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &-item {
    position: relative;
    transition: all @animation-duration-base @animation-timing-function;

    &__icon {
      font-size: @nav-icon-size;
      margin-bottom: 4px;
      transition: all @animation-duration-base @animation-timing-function;
      color: @nav-color-inactive;
    }

    &__text {
      font-size: @font-size-sm;
      font-weight: @font-weight-medium;
      transition: all @animation-duration-base @animation-timing-function;
      color: @nav-color-inactive;
    }

    // 活跃状态样式
    &--active {
      &::before {
        content: "";
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 48px;
        background: fade(@primary-color, 12%);
        border-radius: @border-radius-xl;
        z-index: 0;
        transition: all @animation-duration-base @animation-timing-function;
        animation: tab-pulse 2s ease-in-out infinite;
      }

      &::after {
        content: "";
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background: @primary-color;
        border-radius: 50%;
        z-index: 1;
      }

      .van-tabbar-item__icon {
        color: @nav-color-active;
        transform: scale(1.1);
        filter: drop-shadow(0 2px 8px fade(@primary-color, 30%));
        position: relative;
        z-index: 2;
      }

      .van-tabbar-item__text {
        color: @nav-color-active;
        font-weight: @font-weight-semibold;
        transform: scale(1.05);
        position: relative;
        z-index: 2;
      }
    }

    // 悬停效果（针对桌面端）
    &:hover:not(&--active) {
      .van-tabbar-item__icon {
        color: fade(@nav-color-active, 60%);
        transform: scale(1.05);
      }

      .van-tabbar-item__text {
        color: fade(@nav-color-active, 60%);
      }
    }

    // 点击效果
    &:active {
      transform: scale(0.95);
    }
  }

  // 活跃指示器（顶部小条）
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      @primary-color 50%,
      transparent 100%
    );
    opacity: 1;
    border-radius: 0 0 @border-radius-sm @border-radius-sm;
    box-shadow: 0 1px 4px fade(@primary-color, 40%);
    transition: all @animation-duration-base @animation-timing-function;
  }
}

/* 全局加载遮罩 */
.global-loading-overlay {
  z-index: @z-index-modal;

  .global-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;

    .van-loading {
      font-size: @font-size-base;

      &__text {
        color: @primary-color;
        margin-top: @spacing-xs;
      }
    }
  }
}

/* 任务项现代化样式 */
.task-item {
  margin-bottom: @spacing-xs;
  background: @card-background;
  border-radius: @card-border-radius;
  box-shadow: @card-shadow;
  overflow: hidden;
  transition: all @animation-duration-base @animation-timing-function;

  &:hover {
    box-shadow: @shadow-float;
    transform: translateY(-1px);
  }

  &.completed {
    opacity: 0.7;

    .task-title {
      text-decoration: line-through;
      color: @text-color-secondary;
    }
  }

  &.readonly {
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: @card-shadow;
    }
  }

  .van-cell {
    padding: @spacing-sm @spacing-md;
    background: transparent;
    border: none;

    &::after {
      display: none;
    }
  }
}

/* 任务统计卡片 */
.task-stats {
  padding: @spacing-md;
  background: @card-background;
  margin: @spacing-sm @spacing-sm @spacing-xs;
  border-radius: @card-border-radius;
  box-shadow: @card-shadow;
}

/* 科目进度条 */
.subject-progress {
  margin-bottom: @spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

.progress-text {
  font-size: @font-size-base;
  font-weight: @font-weight-medium;
  color: @text-color;
  margin-bottom: @spacing-xs;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 现代化进度条 */
.van-progress {
  &__portion {
    border-radius: @border-radius-lg;
  }

  &__pivot {
    border-radius: @border-radius-lg;
    font-weight: @font-weight-semibold;
    font-size: @font-size-sm;
  }
}

/* 日期导航现代化样式 */
.date-navigator {
  background: @card-background;
  padding: @spacing-sm;
  border-bottom: 1px solid @border-color-light;
  position: sticky;
  top: 46px;
  z-index: @z-index-fixed;
  box-shadow: @shadow-card;
}

.date-display {
  text-align: center;
  font-size: @font-size-h2;
  font-weight: @font-weight-semibold;
  margin-bottom: @spacing-sm;

  &.today {
    color: @primary-color;
  }

  &.history {
    color: @text-color-secondary;
  }
}

.date-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: @spacing-sm;
}

/* 空状态现代化样式 */
.empty-tasks {
  padding: @spacing-xl @spacing-md;
  text-align: center;

  .van-empty {
    &__description {
      color: @text-color-secondary;
      font-size: @font-size-base;
    }
  }
}

/* 骨架屏现代化样式 */
.loading-skeleton {
  padding: @spacing-md;

  .van-skeleton {
    margin-bottom: @spacing-md;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

/* 页面容器 */
.page-container {
  min-height: 100vh;
  background: @background-dark;
}

/* 卡片容器 */
.card-container {
  background: @card-background;
  border-radius: @card-border-radius;
  box-shadow: @card-shadow;
  padding: @card-padding;
  margin: @spacing-sm;
}

/* 渐变卡片 */
.gradient-card {
  background: @card-gradient-bg;
  color: @card-gradient-color;
  border-radius: @card-border-radius;
  box-shadow: @shadow-soft;
  padding: @card-padding;
  margin: @spacing-sm;
}

/* 现代化按钮样式 */
.van-button {
  border-radius: @button-border-radius;
  font-weight: @font-weight-semibold;
  transition: all @animation-duration-base @animation-timing-function;

  &--primary {
    background: @button-primary-bg;
    border-color: @button-primary-border;
    color: @button-primary-color;
    box-shadow: @shadow-button;

    &:hover {
      background: @button-primary-hover-bg;
      transform: translateY(-1px);
      box-shadow: @shadow-float;
    }

    &:active {
      background: @button-primary-active-bg;
      transform: translateY(0);
    }
  }

  &--default {
    background: @button-secondary-bg;
    border-color: @button-secondary-border;
    color: @button-secondary-color;

    &:hover {
      background: @button-secondary-hover-bg;
    }
  }

  &--round {
    border-radius: @border-radius-xl;
  }
}

/* 现代化输入框样式 */
.van-field {
  &__control {
    background: @input-background;
    border-radius: @input-border-radius;
    padding: @input-padding;
    border: 1px solid @input-border-color;
    font-family: @font-family-base;
    transition: all @animation-duration-base @animation-timing-function;

    &:focus {
      border-color: @input-focus-border-color;
      box-shadow: 0 0 0 2px fade(@primary-color, 20%);
    }

    &::placeholder {
      color: @input-placeholder-color;
    }
  }

  &__label {
    color: @text-color;
    font-weight: @font-weight-medium;
  }
}

/* 现代化弹窗样式 */
.van-popup {
  border-radius: @border-radius-lg @border-radius-lg 0 0;
  overflow: hidden;
}

/* 动画定义 */
@keyframes tab-pulse {
  0%,
  100% {
    opacity: 0.12;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.2;
    transform: translateX(-50%) scale(1.05);
  }
}

/* 响应式设计 */
@media (max-width: @screen-sm) {
  .card-container,
  .gradient-card {
    margin: @spacing-xs;
    border-radius: @border-radius-sm;
  }

  .task-stats {
    margin: @spacing-xs;
    padding: @spacing-sm;
  }

  // 移动端优化tab样式
  .van-tabbar {
    &-item {
      &--active {
        &::before {
          width: 44px;
          height: 44px;
          top: 10px;
        }

        &::after {
          top: 8px;
        }
      }
    }
  }
}
</style>
