<template>
  <div class="chatbot">
    <div class="fixed-header">
      <van-nav-bar title="AI助手" left-arrow @click-left="onBack">
        <template #right>
          <van-icon name="home-o" @click="goHome" />
        </template>
      </van-nav-bar>
    </div>

    <div class="main-content">
      <div v-if="isLoading" class="loading-container">
        <van-loading size="24px" vertical>AI助手加载中...</van-loading>
      </div>

      <iframe
        ref="chatbotFrame"
        :src="chatbotUrl"
        class="messages-container"
        :class="{ hidden: isLoading }"
        frameborder="0"
        title="AI助手"
        @load="onIframeLoad"
        @error="onIframeError"
      ></iframe>

      <!-- 错误状态 -->
      <div v-if="hasError" class="error-container">
        <van-empty image="error" description="加载失败，请检查网络连接">
          <van-button
            round
            type="primary"
            class="bottom-button"
            @click="retryLoad"
          >
            重新加载
          </van-button>
        </van-empty>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Chatbot",

  data() {
    return {
      // 聊天机器人网页地址配置
      // 你可以根据需要修改这个URL，支持以下几种选择：
      // 1. ChatGPT: "https://chat.openai.com"
      // 2. 文心一言: "https://yiyan.baidu.com"
      // 3. 通义千问: "https://tongyi.aliyun.com"
      // 4. 自定义的聊天机器人URL
      baseChatbotUrl: "https://micoai.cn:33081/chatbot/U1Y1I207JDSiDn5m",
      chatbotUrlWithToken: null, // 存储带token参数的URL
      isLoading: true,
      hasError: false,
    };
  },

  computed: {
    ...mapState(["token"]),

    // 动态计算带参数的聊天机器人URL
    chatbotUrl() {
      return this.chatbotUrlWithToken || this.baseChatbotUrl;
    },
  },

  watch: {
    // 监听token变化，重新构建URL
    async token(newToken) {
      if (newToken !== undefined) {
        await this.buildChatbotUrl();
        // 如果iframe已经存在，重新加载
        if (this.$refs.chatbotFrame) {
          this.retryLoad();
        }
      }
    },
  },

  async mounted() {
    // 监听 iframe 加载完成事件
    this.$refs.chatbotFrame?.addEventListener("load", this.onIframeLoad);
    this.$refs.chatbotFrame?.addEventListener("error", this.onIframeError);

    // 构建带token的URL
    await this.buildChatbotUrl();
  },

  beforeDestroy() {
    // 清理事件监听器
    this.$refs.chatbotFrame?.removeEventListener("load", this.onIframeLoad);
    this.$refs.chatbotFrame?.removeEventListener("error", this.onIframeError);
  },

  methods: {
    async encodeAndCompress(text) {
      try {
        // 1. 将文本编码为 Uint8Array
        const textEncoder = new TextEncoder();
        const uint8Array = textEncoder.encode(text);

        // 2. 使用 gzip 压缩
        const compressedStream = new Response(uint8Array).body.pipeThrough(
          new CompressionStream("gzip")
        );
        const compressedArrayBuffer = await new Response(
          compressedStream
        ).arrayBuffer();
        const compressedUint8Array = new Uint8Array(compressedArrayBuffer);

        // 3. 转换为二进制字符串
        const binaryString = Array.from(compressedUint8Array)
          .map((byte) => String.fromCharCode(byte))
          .join("");

        // 4. Base64 编码
        const base64String = btoa(binaryString);

        return base64String;
      } catch (error) {
        console.error("编码失败:", error);
        return null;
      }
    },

    async buildChatbotUrl() {
      try {
        if (this.token) {
          const encodedToken = await this.encodeAndCompress(this.token);
          if (encodedToken) {
            // 构建带参数的URL
            const url = new URL(this.baseChatbotUrl);
            url.searchParams.set("sys.user_id", encodedToken);
            this.chatbotUrlWithToken = url.toString();
            console.log("构建聊天机器人URL成功");
          } else {
            console.warn("Token编码失败，使用原始URL");
            this.chatbotUrlWithToken = null;
          }
        } else {
          console.warn("用户未登录，使用原始URL");
          this.chatbotUrlWithToken = null;
        }
      } catch (error) {
        console.error("构建聊天机器人URL失败:", error);
        this.chatbotUrlWithToken = null;
      }
    },
    onBack() {
      // 返回上一页
      this.$router.go(-1);
    },

    goHome() {
      // 返回主页面
      this.$router.push("/tasks");
    },

    onIframeLoad() {
      this.isLoading = false;
      this.hasError = false;
      console.log("Chatbot iframe loaded successfully");
    },

    onIframeError() {
      this.isLoading = false;
      this.hasError = true;
      console.error("Failed to load chatbot iframe");
    },

    retryLoad() {
      this.isLoading = true;
      this.hasError = false;
      // 重新加载iframe
      if (this.$refs.chatbotFrame) {
        this.$refs.chatbotFrame.src = this.chatbotUrl;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.chatbot {
  height: 100vh;
  background-color: @background-dark;
  overflow: hidden;
  font-family: @font-family-base;

  /* 现代化固定头部 */
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: @z-index-fixed;
    background: @card-background;
    box-shadow: @shadow-card;
    transition: all @animation-duration-base @animation-timing-function;

    &.scrolled {
      box-shadow: @shadow-float;
    }
  }

  /* 现代化消息容器 */
  .messages-container {
    width: 100%;
    height: calc(100vh - 0px);
    overflow-y: auto;
    padding: 0;
    background: @background-dark;

    .message {
      display: flex;
      margin-bottom: @spacing-md;
      transition: all @animation-duration-base @animation-timing-function;

      &.user {
        justify-content: flex-end;

        .message-bubble {
          background: @card-gradient-bg;
          color: @text-color-inverse;
          border-radius: @border-radius-lg @border-radius-sm @border-radius-lg
            @border-radius-lg;
          max-width: 80%;
          padding: @spacing-sm @spacing-md;
          font-size: @font-size-base;
          line-height: @line-height-base;
          box-shadow: @shadow-button;
          word-wrap: break-word;
        }
      }

      &.bot {
        justify-content: flex-start;

        .message-bubble {
          background: @card-background;
          color: @text-color;
          border-radius: @border-radius-sm @border-radius-lg @border-radius-lg
            @border-radius-lg;
          max-width: 80%;
          padding: @spacing-sm @spacing-md;
          font-size: @font-size-base;
          line-height: @line-height-base;
          box-shadow: @card-shadow;
          word-wrap: break-word;
          border: 1px solid @border-color-light;
        }
      }

      &.typing {
        .message-bubble {
          background: @background-dark;
          padding: @spacing-md;
          border-radius: @border-radius-lg;

          .typing-indicator {
            display: flex;
            gap: @spacing-xs / 2;
            align-items: center;

            .dot {
              width: 8px;
              height: 8px;
              background: @text-color-secondary;
              border-radius: @border-radius-round;
              animation: typing 1.4s infinite ease-in-out;

              &:nth-child(1) {
                animation-delay: -0.32s;
              }
              &:nth-child(2) {
                animation-delay: -0.16s;
              }
              &:nth-child(3) {
                animation-delay: 0s;
              }
            }
          }
        }
      }
    }
  }

  /* 现代化输入区域 */
  .input-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: @card-background;
    padding: @spacing-sm @spacing-md;
    border-top: 1px solid @border-color-light;
    box-shadow: @shadow-soft;

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: @spacing-sm;

      .van-field {
        flex: 1;
        background: @input-background;
        border: 1px solid @border-color-light;
        border-radius: @border-radius-lg;
        transition: all @animation-duration-base @animation-timing-function;

        &:focus-within {
          border-color: @primary-color;
          box-shadow: 0 0 0 2px fade(@primary-color, 20%);
        }

        :deep(.van-field__control) {
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          max-height: 100px;
          min-height: 20px;
          padding: @spacing-sm;
          font-family: @font-family-base;
          font-size: @font-size-base;
          line-height: @line-height-base;

          &::placeholder {
            color: @text-color-placeholder;
          }
        }
      }

      .send-button {
        border-radius: @border-radius-round;
        width: 44px;
        height: 44px;
        background: @button-primary-bg;
        border: none;
        box-shadow: @shadow-button;
        transition: all @animation-duration-base @animation-timing-function;

        &:hover {
          background: @button-primary-hover-bg;
          transform: scale(1.05);
          box-shadow: @shadow-float;
        }

        &:active {
          transform: scale(0.95);
        }

        &:disabled {
          opacity: 0.5;
          transform: none;
          box-shadow: @shadow-button;
        }

        .van-icon {
          color: @text-color-inverse;
          font-size: @font-size-lg;
        }
      }
    }

    /* 快捷回复建议 */
    .quick-replies {
      margin-top: @spacing-sm;
      display: flex;
      gap: @spacing-xs;
      flex-wrap: wrap;

      .quick-reply-btn {
        background: @background-dark;
        border: 1px solid @border-color-light;
        border-radius: @border-radius-lg;
        padding: @spacing-xs @spacing-sm;
        font-size: @font-size-sm;
        color: @text-color;
        cursor: pointer;
        transition: all @animation-duration-base @animation-timing-function;

        &:hover {
          background: @primary-color;
          color: @text-color-inverse;
          border-color: @primary-color;
        }
      }
    }
  }
}

/* 打字动画 */
@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: @screen-sm) {
  .chatbot {
    .messages-container {
      padding: 0;

      .message {
        margin-bottom: @spacing-sm;

        &.user,
        &.bot {
          .message-bubble {
            max-width: 85%;
            padding: @spacing-xs @spacing-sm;
            font-size: @font-size-sm;
          }
        }
      }
    }

    .input-container {
      padding: @spacing-xs @spacing-sm;

      .input-wrapper {
        gap: @spacing-xs;

        .send-button {
          width: 40px;
          height: 40px;

          .van-icon {
            font-size: @font-size-base;
          }
        }
      }

      .quick-replies {
        margin-top: @spacing-xs;
        gap: @spacing-xs / 2;

        .quick-reply-btn {
          padding: @spacing-xs / 2 @spacing-xs;
          font-size: @font-size-xs;
        }
      }
    }
  }
}

@media (max-width: @screen-xs) {
  .chatbot {
    .messages-container {
      .message {
        &.user,
        &.bot {
          .message-bubble {
            max-width: 90%;
            font-size: @font-size-xs;
          }
        }
      }
    }
  }
}
</style>
