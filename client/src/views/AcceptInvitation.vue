<template>
  <div class="accept-invitation-page">
    <div class="invitation-card">
      <div class="card-header">
        <van-icon name="certificate" size="60" color="#667eea" />
        <h1>子账户邀请</h1>
      </div>

      <div class="card-content" v-if="!processing && !result">
        <h2>您收到了一份邀请</h2>
        <p class="invitation-desc">
          有人邀请您成为任务管理系统的子账户。作为子账户，您将享有与主账户相同的权限，包括查看和管理所有共享任务。
        </p>

        <div class="invitation-actions">
          <van-button
            type="primary"
            size="large"
            block
            @click="handleAcceptInvitation"
            :loading="accepting"
          >
            接受邀请
          </van-button>

          <van-button
            size="large"
            block
            @click="handleDeclineInvitation"
            class="decline-btn"
          >
            拒绝邀请
          </van-button>
        </div>
      </div>

      <div class="card-content" v-if="processing">
        <van-loading size="50" vertical>处理中...</van-loading>
      </div>

      <div class="card-content" v-if="result">
        <div class="result-content" :class="result.type">
          <van-icon
            :name="result.type === 'success' ? 'checked' : 'close'"
            size="60"
            :color="result.type === 'success' ? '#07c160' : '#ee0a24'"
          />
          <h2>{{ result.title }}</h2>
          <p>{{ result.message }}</p>

          <van-button
            v-if="result.type === 'success'"
            type="primary"
            size="large"
            @click="goToLogin"
          >
            去登录
          </van-button>

          <van-button v-else size="large" @click="$router.push('/')">
            返回首页
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/request";

export default {
  name: "AcceptInvitation",

  data() {
    return {
      processing: true,
      accepting: false,
      result: null,
      inviteToken: "",
    };
  },

  async created() {
    // 从URL参数中获取邀请token
    this.inviteToken = this.$route.query.token;

    if (!this.inviteToken) {
      this.showError("邀请链接无效", "缺少必要的邀请参数");
      return;
    }

    // 验证邀请是否有效（可选，也可以直接在接受时验证）
    this.processing = false;
  },

  methods: {
    async handleAcceptInvitation() {
      if (!this.inviteToken) {
        this.$toast.fail("邀请链接无效");
        return;
      }

      try {
        this.accepting = true;

        const response = await request.post("/user/accept-invitation", {
          token: this.inviteToken,
        });

        this.showSuccess(
          "邀请接受成功！",
          "您已成为子账户，现在可以使用您的邮箱登录系统。"
        );
      } catch (error) {
        console.error("接受邀请失败:", error);
        const message =
          error.response?.data?.message || "接受邀请失败，请稍后重试";
        this.showError("邀请接受失败", message);
      } finally {
        this.accepting = false;
      }
    },

    handleDeclineInvitation() {
      this.$dialog
        .confirm({
          title: "确认拒绝",
          message: "确定要拒绝这个邀请吗？拒绝后将无法再次接受。",
        })
        .then(() => {
          this.showError("已拒绝邀请", "您已拒绝成为子账户的邀请。");
        })
        .catch(() => {
          // 用户取消
        });
    },

    showSuccess(title, message) {
      this.result = {
        type: "success",
        title,
        message,
      };
    },

    showError(title, message) {
      this.result = {
        type: "error",
        title,
        message,
      };
    },

    goToLogin() {
      this.$router.push("/login");
    },
  },
};
</script>

<style lang="less" scoped>
.accept-invitation-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.invitation-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card-header {
  margin-bottom: 30px;

  h1 {
    margin: 20px 0 0 0;
    font-size: 28px;
    color: #333;
    font-weight: 600;
  }
}

.card-content {
  h2 {
    margin: 0 0 20px 0;
    font-size: 22px;
    color: #333;
    font-weight: 500;
  }

  .invitation-desc {
    color: #666;
    line-height: 1.6;
    margin-bottom: 30px;
    font-size: 16px;
  }
}

.invitation-actions {
  .van-button {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .decline-btn {
    color: #666;
    border-color: #ddd;

    &:hover {
      color: #333;
      border-color: #999;
    }
  }
}

.result-content {
  &.success {
    h2 {
      color: #07c160;
    }
  }

  &.error {
    h2 {
      color: #ee0a24;
    }
  }

  p {
    color: #666;
    line-height: 1.6;
    margin: 20px 0 30px 0;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .accept-invitation-page {
    padding: 15px;
  }

  .invitation-card {
    padding: 30px 20px;
  }

  .card-header h1 {
    font-size: 24px;
  }

  .card-content h2 {
    font-size: 20px;
  }

  .invitation-desc {
    font-size: 15px;
  }
}
</style>
