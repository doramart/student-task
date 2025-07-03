<template>
  <div class="pwa-update-manager">
    <!-- 更新提示悬浮按钮 -->
    <div v-if="showUpdateButton" class="update-fab" @click="handleUpdate">
      <van-icon name="upgrade" />
      <span class="update-text">更新</span>
    </div>

    <!-- 更新进度遮罩 -->
    <van-overlay :show="updating" class="update-overlay">
      <div class="update-progress">
        <van-loading type="spinner" size="24px" />
        <p>正在更新应用...</p>
        <p class="progress-tip">请稍候，即将完成</p>
      </div>
    </van-overlay>

    <!-- 版本信息弹窗 -->
    <van-popup
      v-model="showVersionDialog"
      position="bottom"
      :style="{ height: '50%' }"
      round
    >
      <div class="version-dialog">
        <div class="dialog-header">
          <h3>版本信息</h3>
          <van-icon name="cross" @click="showVersionDialog = false" />
        </div>

        <div class="version-content">
          <div class="version-item">
            <label>当前版本：</label>
            <span>{{ currentVersion }}</span>
          </div>

          <div class="version-item">
            <label>缓存状态：</label>
            <span :class="cacheStatus.class">{{ cacheStatus.text }}</span>
          </div>

          <div class="version-item">
            <label>离线状态：</label>
            <span :class="offlineStatus.class">{{ offlineStatus.text }}</span>
          </div>

          <div class="version-item">
            <label>最后更新：</label>
            <span>{{ lastUpdateTime }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <van-button
            type="info"
            size="small"
            @click="checkForUpdates"
            :loading="checkingUpdate"
          >
            检查更新
          </van-button>

          <van-button
            type="warning"
            size="small"
            @click="clearCache"
            :loading="clearingCache"
          >
            清理缓存
          </van-button>

          <van-button
            type="default"
            size="small"
            @click="showUpdateHistory = true"
          >
            更新历史
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 更新历史弹窗 -->
    <van-popup
      v-model="showUpdateHistory"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <div class="update-history">
        <div class="dialog-header">
          <h3>更新历史</h3>
          <van-icon name="cross" @click="showUpdateHistory = false" />
        </div>

        <div class="history-list">
          <div
            v-for="(item, index) in updateHistory"
            :key="index"
            class="history-item"
          >
            <div class="history-version">v{{ item.version }}</div>
            <div class="history-date">{{ formatDate(item.date) }}</div>
            <div class="history-features">
              <div
                v-for="(feature, idx) in item.features"
                :key="idx"
                class="feature-item"
              >
                • {{ feature }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
export default {
  name: "PWAUpdateManager",
  data() {
    return {
      showUpdateButton: false,
      updating: false,
      showVersionDialog: false,
      showUpdateHistory: false,
      checkingUpdate: false,
      clearingCache: false,
      currentVersion: "v1.0.0",
      lastUpdateTime: "刚刚",
      newWorker: null,
      registration: null,
      updateHistoryIndex: 0,
      updateHistory: [
        {
          version: "1.0.0",
          date: new Date(),
          features: [
            "🎉 全新的PWA体验",
            "📱 支持离线使用",
            "🔄 智能更新机制",
            "💾 数据本地缓存",
          ],
        },
      ],
    };
  },
  computed: {
    cacheStatus() {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        return {
          text: "已启用",
          class: "status-success",
        };
      }
      return {
        text: "未启用",
        class: "status-error",
      };
    },
    offlineStatus() {
      return navigator.onLine
        ? {
            text: "在线",
            class: "status-success",
          }
        : {
            text: "离线",
            class: "status-warning",
          };
    },
  },
  mounted() {
    this.initPWAManager();
    this.loadUpdateHistory();
  },
  methods: {
    // 初始化PWA管理器
    initPWAManager() {
      // 监听在线状态变化
      window.addEventListener("online", this.handleOnlineStatusChange);
      window.addEventListener("offline", this.handleOnlineStatusChange);

      // 监听Service Worker更新
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener(
          "message",
          this.handleSWMessage
        );
      }
    },

    // 处理在线状态变化
    handleOnlineStatusChange() {
      const status = navigator.onLine
        ? "应用已连接网络"
        : "应用已离线，部分功能可能受限";
      this.$toast({
        message: status,
        type: navigator.onLine ? "success" : "warning",
        duration: 2000,
      });
    },

    // 处理Service Worker消息
    handleSWMessage(event) {
      const { type, data } = event.data || {};

      switch (type) {
        case "SW_ACTIVATED":
          this.currentVersion = `v${data.version || "1.0.0"}`;
          this.lastUpdateTime = "刚刚";
          break;

        case "UPDATE_AVAILABLE":
          this.showUpdateButton = true;
          this.newWorker = data.worker;
          break;
      }
    },

    // 显示更新提示
    showUpdatePrompt(newWorker) {
      this.newWorker = newWorker;
      this.showUpdateButton = true;
    },

    // 处理更新
    async handleUpdate() {
      if (!this.newWorker) {
        await this.checkForUpdates();
        return;
      }

      this.$dialog
        .confirm({
          title: "应用更新",
          message: `
          <div style="text-align: left; padding: 10px 0;">
            <p>🚀 发现新版本可用！</p>
            <p>📈 新版本包含性能优化和功能改进</p>
            <br>
            <p style="color: #666; font-size: 12px;">
              💡 更新过程中会重新加载页面<br>
              📝 请确保重要数据已保存
            </p>
          </div>
        `,
          confirmButtonText: "立即更新",
          cancelButtonText: "稍后更新",
          dangerouslyUseHTMLString: true,
        })
        .then(() => {
          this.performUpdate();
        })
        .catch(() => {
          this.showUpdateButton = false;
          // 30分钟后再次提醒
          setTimeout(() => {
            this.showUpdateButton = true;
          }, 30 * 60 * 1000);
        });
    },

    // 执行更新
    performUpdate() {
      this.updating = true;
      this.showUpdateButton = false;

      // 发送跳过等待指令
      if (this.newWorker) {
        this.newWorker.postMessage({ type: "SKIP_WAITING" });
      }

      // 监听控制器变化
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        this.updating = false;

        // 记录更新历史
        this.addUpdateHistory();

        this.$toast.success({
          message: "更新完成！即将重新加载",
          duration: 1500,
          onClose: () => {
            window.location.reload();
          },
        });
      });
    },

    // 检查更新
    async checkForUpdates() {
      this.checkingUpdate = true;

      try {
        if (this.registration) {
          await this.registration.update();

          setTimeout(() => {
            this.checkingUpdate = false;
            this.$toast.success("已检查更新");
          }, 1000);
        } else {
          throw new Error("Service Worker 未注册");
        }
      } catch (error) {
        this.checkingUpdate = false;
        this.$toast.fail("检查更新失败");
        console.error("检查更新失败:", error);
      }
    },

    // 清理缓存
    async clearCache() {
      try {
        await this.$dialog.confirm({
          title: "清理缓存",
          message: "确定要清理应用缓存吗？这将删除离线数据，需要重新下载资源。",
          confirmButtonText: "确定清理",
          cancelButtonText: "取消",
        });

        this.clearingCache = true;

        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          // 创建消息通道
          const messageChannel = new MessageChannel();

          // 监听响应
          messageChannel.port1.onmessage = (event) => {
            this.clearingCache = false;
            if (event.data.success) {
              this.$toast.success("缓存清理完成");
            } else {
              this.$toast.fail("缓存清理失败");
            }
          };

          // 发送清理指令
          navigator.serviceWorker.controller.postMessage(
            { type: "CLEAR_CACHE" },
            [messageChannel.port2]
          );
        } else {
          // 如果没有Service Worker，清理浏览器缓存
          if ("caches" in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          }

          this.clearingCache = false;
          this.$toast.success("缓存清理完成");
        }
      } catch (error) {
        this.clearingCache = false;
        if (error !== "cancel") {
          this.$toast.fail("缓存清理失败");
          console.error("清理缓存失败:", error);
        }
      }
    },

    // 添加更新历史
    addUpdateHistory() {
      const newHistory = {
        version: this.currentVersion.replace("v", ""),
        date: new Date(),
        features: ["🐛 修复已知问题", "⚡ 性能优化", "🔧 体验改进"],
      };

      this.updateHistory.unshift(newHistory);
      this.saveUpdateHistory();
    },

    // 加载更新历史
    loadUpdateHistory() {
      try {
        const saved = localStorage.getItem("pwa_update_history");
        if (saved) {
          const history = JSON.parse(saved);
          this.updateHistory = history.map((item) => ({
            ...item,
            date: new Date(item.date),
          }));
        }
      } catch (error) {
        console.error("加载更新历史失败:", error);
      }
    },

    // 保存更新历史
    saveUpdateHistory() {
      try {
        localStorage.setItem(
          "pwa_update_history",
          JSON.stringify(this.updateHistory)
        );
      } catch (error) {
        console.error("保存更新历史失败:", error);
      }
    },

    // 格式化日期
    formatDate(date) {
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "刚刚";
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return date.toLocaleDateString();
    },

    // 设置Service Worker注册信息
    setRegistration(registration) {
      this.registration = registration;
    },
  },
  beforeDestroy() {
    window.removeEventListener("online", this.handleOnlineStatusChange);
    window.removeEventListener("offline", this.handleOnlineStatusChange);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.removeEventListener(
        "message",
        this.handleSWMessage
      );
    }
  },
};
</script>

<style lang="less" scoped>
.pwa-update-manager {
  .update-fab {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1989fa;
    color: white;
    border-radius: 25px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 12px rgba(25, 137, 250, 0.3);
    cursor: pointer;
    z-index: 1000;
    transition: all 0.3s ease;
    animation: pulse 2s infinite;

    &:hover {
      transform: scale(1.05);
    }

    .update-text {
      font-size: 12px;
      font-weight: 500;
    }
  }

  .update-overlay {
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;

    .update-progress {
      background: white;
      padding: 24px;
      border-radius: 12px;
      text-align: center;

      p {
        margin: 12px 0 0 0;
        color: #333;
        font-size: 14px;
      }

      .progress-tip {
        color: #666;
        font-size: 12px;
        margin-top: 8px;
      }
    }
  }

  .version-dialog,
  .update-history {
    height: 100%;
    display: flex;
    flex-direction: column;

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .van-icon {
        font-size: 18px;
        color: #666;
        cursor: pointer;
      }
    }

    .version-content {
      flex: 1;
      padding: 20px;

      .version-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f5f5f5;

        label {
          color: #666;
          font-size: 14px;
        }

        span {
          font-size: 14px;
          font-weight: 500;

          &.status-success {
            color: #07c160;
          }

          &.status-warning {
            color: #ff976a;
          }

          &.status-error {
            color: #ee0a24;
          }
        }
      }
    }

    .action-buttons {
      padding: 16px 20px;
      display: flex;
      gap: 12px;
      border-top: 1px solid #eee;

      .van-button {
        flex: 1;
      }
    }

    .history-list {
      flex: 1;
      padding: 0 20px;
      overflow-y: auto;

      .history-item {
        padding: 16px 0;
        border-bottom: 1px solid #f5f5f5;

        .history-version {
          font-size: 16px;
          font-weight: 600;
          color: #1989fa;
          margin-bottom: 4px;
        }

        .history-date {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .history-features {
          .feature-item {
            font-size: 13px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 2px;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
