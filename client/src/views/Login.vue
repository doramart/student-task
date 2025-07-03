<template>
  <div class="login-container">
    <div class="login-header">
      <h1 class="login-title">学生任务管理</h1>
      <p class="login-subtitle">请使用邮箱验证码登录</p>
    </div>

    <div class="login-form">
      <van-cell-group>
        <!-- 邮箱输入 -->
        <van-field
          v-model="form.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱地址"
          :rules="emailRules"
          left-icon="envelop-o"
          clearable
        />

        <!-- 验证码输入 -->
        <van-field
          v-model="form.code"
          name="code"
          label="验证码"
          placeholder="请输入6位验证码"
          :rules="codeRules"
          left-icon="shield-o"
          clearable
          maxlength="6"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="!canSendCode || sendingCode"
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ sendButtonText }}
            </van-button>
          </template>
        </van-field>

        <!-- 登录按钮 -->
        <div class="login-button-container">
          <van-button
            round
            block
            type="primary"
            :loading="loggingIn"
            :disabled="!form.email || !form.code"
            @click="handleLogin"
          >
            {{ loggingIn ? "登录中..." : "登录" }}
          </van-button>
        </div>
      </van-cell-group>
    </div>

    <!-- 登录说明 -->
    <div class="login-tips">
      <p>📧 首次登录将自动创建账号</p>
      <p>🔒 验证码有效期为5分钟</p>
      <p>⏰ 同一邮箱1分钟内只能发送一次验证码</p>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { Toast } from "vant";

export default {
  name: "Login",
  data() {
    return {
      form: {
        email: "",
        code: "",
      },
      sendingCode: false,
      loggingIn: false,
      countdown: 0,
      countdownTimer: null,
      // 验证规则
      emailRules: [
        { required: true, message: "请输入邮箱地址" },
        {
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          message: "请输入正确的邮箱格式",
        },
      ],
      codeRules: [
        { required: true, message: "请输入验证码" },
        {
          pattern: /^\d{6}$/,
          message: "验证码必须是6位数字",
        },
      ],
    };
  },

  computed: {
    // 是否可以发送验证码
    canSendCode() {
      return (
        this.form.email &&
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          this.form.email
        ) &&
        this.countdown === 0
      );
    },

    // 发送按钮文本
    sendButtonText() {
      if (this.sendingCode) {
        return "发送中";
      }
      if (this.countdown > 0) {
        return `${this.countdown}s后重试`;
      }
      return "发送验证码";
    },
  },

  beforeDestroy() {
    // 清理定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  methods: {
    ...mapActions(["sendVerifyCode", "login"]),

    // 处理发送验证码
    async handleSendCode() {
      if (!this.canSendCode) return;

      try {
        this.sendingCode = true;
        await this.sendVerifyCode(this.form.email);

        Toast.success("验证码发送成功，请查收邮件");
        this.startCountdown();
      } catch (error) {
        console.error("发送验证码失败:", error);
        Toast.fail(error.message || "发送验证码失败");
      } finally {
        this.sendingCode = false;
      }
    },

    // 开始倒计时
    startCountdown() {
      this.countdown = 60;
      this.countdownTimer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
      }, 1000);
    },

    // 处理登录
    async handleLogin() {
      if (!this.form.email || !this.form.code) return;

      try {
        this.loggingIn = true;

        await this.login({
          email: this.form.email,
          code: this.form.code,
        });

        Toast.success("登录成功");

        // 获取重定向路径或默认跳转到首页
        const redirect = this.$route.query.redirect || "/";
        this.$router.replace(redirect);
      } catch (error) {
        console.error("登录失败:", error);
        Toast.fail(error.message || "登录失败");
      } finally {
        this.loggingIn = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.login-container {
  min-height: 100vh;
  background: @card-gradient-bg;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: @spacing-md;
  font-family: @font-family-base;
}

.login-header {
  text-align: center;
  margin-bottom: @spacing-xl;
  color: @text-color-inverse;

  .login-title {
    font-size: @font-size-h1;
    font-weight: @font-weight-bold;
    margin: 0 0 @spacing-xs 0;
    text-shadow: @shadow-soft;
    letter-spacing: -0.5px;
  }

  .login-subtitle {
    font-size: @font-size-lg;
    opacity: 0.9;
    margin: 0;
    font-weight: @font-weight-regular;
  }
}

.login-form {
  width: 100%;
  max-width: 400px;
  background: @card-background;
  border-radius: @border-radius-xl;
  padding: @spacing-xl;
  box-shadow: @shadow-float;
  margin-bottom: @spacing-lg;
  backdrop-filter: blur(10px);

  :deep(.van-cell-group) {
    background: transparent;
    border-radius: @border-radius-lg;
    overflow: visible;
  }

  :deep(.van-cell) {
    padding: 0;
    background: transparent;
    border: none;

    &::after {
      display: none;
    }
  }

  :deep(.van-field) {
    padding: @spacing-xs @spacing-xs;
    background: @input-background;
    border-radius: @input-border-radius;
    margin-bottom: @spacing-md;
    border: 1px solid @border-color-light;
    transition: all @animation-duration-base @animation-timing-function;
    min-height: 54px;
    display: flex;
    align-items: center;

    &:last-child {
      margin-bottom: 0;
    }

    &:focus-within {
      border-color: @input-focus-border-color;
      box-shadow: 0 0 0 2px fade(@primary-color, 20%);
      background: @card-background;
    }
  }

  :deep(.van-field__label) {
    width: 50px;
    font-weight: @font-weight-medium;
    color: @text-color;
    font-family: @font-family-base;
    display: flex;
    align-items: center;
    font-size: @font-size-base;
    flex-shrink: 0;
    line-height: 1;
    margin-right: @spacing-sm;
  }

  :deep(.van-field__control) {
    color: @text-color;
    font-family: @font-family-base;
    padding: 0;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: @font-size-base;
    line-height: 2;

    &::placeholder {
      color: @text-color-placeholder;
    }
  }

  :deep(.van-field__button) {
    margin-left: @spacing-xs;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding-left: 0;
    .van-button {
      border-radius: @border-radius-sm;
      font-size: @font-size-sm;
      font-weight: @font-weight-semibold;
      padding: @spacing-xs @spacing-xs;
      min-width: 100px;
      height: 36px;
    }
  }

  :deep(.van-field__left-icon) {
    color: @text-color-secondary;
    margin-right: @spacing-xs;
    display: flex;
    align-items: center;
    font-size: @font-size-lg;
    flex-shrink: 0;
  }

  :deep(.van-field__body) {
    display: flex;
    align-items: center;
    flex: 1;
    min-height: 36px;
  }
}

.login-button-container {
  margin-top: @spacing-lg;

  :deep(.van-button) {
    height: 50px;
    font-size: @font-size-lg;
    font-weight: @font-weight-semibold;
    box-shadow: @shadow-button;
    border: none;
    border-radius: @button-border-radius;
    background: @button-primary-bg;
    color: @button-primary-color;
    font-family: @font-family-base;
    transition: all @animation-duration-base @animation-timing-function;

    &:hover {
      background: @button-primary-hover-bg;
      transform: translateY(-2px);
      box-shadow: @shadow-float;
    }

    &:active {
      transform: translateY(0);
      background: @button-primary-active-bg;
    }

    &:disabled {
      opacity: 0.6;
      transform: none;
      box-shadow: @shadow-button;
    }
  }
}

.login-tips {
  color: @text-color-inverse;
  font-size: @font-size-base;
  line-height: @line-height-base;
  opacity: 0.9;
  text-align: center;
  max-width: 400px;
  font-family: @font-family-base;

  p {
    margin: @spacing-xs 0;
    padding: 0 @spacing-md;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: @spacing-xs;

    &:before {
      content: "";
      width: 4px;
      height: 4px;
      background: @text-color-inverse;
      border-radius: @border-radius-round;
      opacity: 0.7;
    }
  }
}

// 响应式设计
@media (max-width: @screen-sm) {
  .login-container {
    padding: @spacing-sm;
  }

  .login-form {
    padding: @spacing-md;
    border-radius: @border-radius-lg;
  }

  .login-header {
    margin-bottom: @spacing-md;

    .login-title {
      font-size: @font-size-h2;
    }

    .login-subtitle {
      font-size: @font-size-base;
    }
  }

  .login-tips {
    font-size: @font-size-sm;

    p {
      padding: 0 @spacing-sm;
    }
  }
}

// 额外的视觉增强
.van-field__control:focus {
  outline: none;
}

// 验证码按钮特殊样式
:deep(.van-button--small) {
  &.van-button--primary {
    background: @primary-color;
    border-color: @primary-color;

    &:disabled {
      background: @secondary-color;
      border-color: @secondary-color;
      color: @text-color-secondary;
    }
  }
}
</style>
