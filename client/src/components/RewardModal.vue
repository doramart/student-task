<template>
  <van-overlay :show="visible" class="reward-overlay" @click="handleClose">
    <div class="reward-modal" @click.stop>
      <!-- 关闭按钮 -->
      <van-icon name="cross" class="close-btn" @click="handleClose" />

      <!-- 奖励内容 -->
      <div class="reward-content" :class="rewardType">
        <!-- 装饰图标 -->
        <div class="reward-icon">
          <div v-if="rewardType === 'subject'" class="flower-container">
            <!-- 小红花SVG -->
            <svg
              class="flower-icon"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="flowerGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style="stop-color: #ff6b6b" />
                  <stop offset="100%" style="stop-color: #ff3838" />
                </linearGradient>
              </defs>
              <!-- 花瓣 -->
              <circle
                cx="50"
                cy="30"
                r="12"
                fill="url(#flowerGradient)"
                opacity="0.9"
              />
              <circle
                cx="70"
                cy="50"
                r="12"
                fill="url(#flowerGradient)"
                opacity="0.9"
              />
              <circle
                cx="50"
                cy="70"
                r="12"
                fill="url(#flowerGradient)"
                opacity="0.9"
              />
              <circle
                cx="30"
                cy="50"
                r="12"
                fill="url(#flowerGradient)"
                opacity="0.9"
              />
              <circle
                cx="62"
                cy="35"
                r="10"
                fill="url(#flowerGradient)"
                opacity="0.8"
              />
              <circle
                cx="65"
                cy="65"
                r="10"
                fill="url(#flowerGradient)"
                opacity="0.8"
              />
              <circle
                cx="38"
                cy="65"
                r="10"
                fill="url(#flowerGradient)"
                opacity="0.8"
              />
              <circle
                cx="35"
                cy="35"
                r="10"
                fill="url(#flowerGradient)"
                opacity="0.8"
              />
              <!-- 花心 -->
              <circle cx="50" cy="50" r="8" fill="#ffd93d" />
            </svg>
          </div>

          <div v-else class="trophy-container">
            <!-- 奖杯SVG -->
            <svg
              class="trophy-icon"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="trophyGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style="stop-color: #ffd93d" />
                  <stop offset="100%" style="stop-color: #ff9500" />
                </linearGradient>
              </defs>
              <!-- 奖杯杯身 -->
              <path
                d="M35 25 L65 25 L60 55 L40 55 Z"
                fill="url(#trophyGradient)"
              />
              <!-- 奖杯底座 -->
              <rect x="30" y="55" width="40" height="8" fill="#d4af37" />
              <rect x="25" y="63" width="50" height="6" fill="#b8941f" />
              <!-- 奖杯把手 -->
              <path
                d="M20 30 Q15 35 15 45 Q15 55 20 50"
                stroke="#d4af37"
                stroke-width="3"
                fill="none"
              />
              <path
                d="M80 30 Q85 35 85 45 Q85 55 80 50"
                stroke="#d4af37"
                stroke-width="3"
                fill="none"
              />
              <!-- 装饰 -->
              <circle cx="50" cy="35" r="3" fill="#ff9500" />
              <rect x="40" y="40" width="20" height="2" fill="#ff9500" />
              <rect x="42" y="45" width="16" height="2" fill="#ff9500" />
            </svg>
          </div>
        </div>

        <!-- 文案内容 -->
        <div class="reward-text">
          <h2 class="reward-title">{{ rewardTitle }}</h2>
          <p class="reward-message">{{ rewardMessage }}</p>
          <div v-if="subjectName" class="subject-name">
            {{ subjectName }}科目完成！
          </div>
        </div>

        <!-- 确认按钮 -->
        <van-button
          type="primary"
          class="reward-button"
          @click="handleClose"
          :color="buttonColor"
        >
          {{ buttonText }}
        </van-button>
      </div>

      <!-- 背景装饰效果 -->
      <div class="reward-bg-effects">
        <div
          v-for="i in 12"
          :key="i"
          class="floating-particle"
          :class="rewardType"
          :style="getParticleStyle(i)"
        ></div>
      </div>
    </div>
  </van-overlay>
</template>

<script>
export default {
  name: "RewardModal",

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "subject", // 'subject' | 'all'
      validator: (value) => ["subject", "all"].includes(value),
    },
    subjectName: {
      type: String,
      default: "",
    },
  },

  watch: {
    visible(newVal) {
      // 可以在这里添加一些弹窗显示时的逻辑
      if (newVal) {
        // 弹窗显示时可以添加一些效果，比如播放音效等
      }
    },
  },

  computed: {
    rewardType() {
      return this.type;
    },

    rewardTitle() {
      return "哇，你真棒！";
    },

    rewardMessage() {
      if (this.type === "subject") {
        return "继续下一个项目吧";
      } else {
        return "已经完成了今天的全部任务，去喝口水休息一下吧";
      }
    },

    buttonText() {
      return this.type === "subject" ? "继续加油" : "好的";
    },

    buttonColor() {
      return this.type === "subject" ? "#ff6b6b" : "#ffd93d";
    },
  },

  methods: {
    handleClose() {
      this.$emit("close");
    },

    getParticleStyle(index) {
      const delay = index * 0.2;
      const size = 4 + Math.random() * 6;
      const left = 10 + Math.random() * 80;
      const duration = 2 + Math.random() * 2;

      return {
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        width: `${size}px`,
        height: `${size}px`,
      };
    },
  },
};
</script>

<style lang="less" scoped>
.reward-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;

  .reward-modal {
    position: relative;
    width: 320px;
    max-width: 90%;
    background: white;
    border-radius: @border-radius-xl;
    box-shadow: @shadow-card;
    overflow: hidden;

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
      font-size: @font-size-lg * 1.43;
      color: @text-color-secondary;
      cursor: pointer;
      transition: color 0.3s ease;

      &:hover {
        color: @text-color;
      }
    }

    .reward-content {
      padding: 40px 24px 32px;
      text-align: center;
      position: relative;
      z-index: 2;
      min-height: 200px;
      border-radius: @border-radius-lg;

      &.subject {
        background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
      }

      &.all {
        background: linear-gradient(135deg, #fffbf0 0%, #fff2d9 100%);
      }

      .reward-icon {
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3;
        display: flex;
        justify-content: center;
        align-items: center;

        .flower-container {
          position: relative;

          .flower-icon {
            width: 200px;
            height: 200px;
            animation: flowerBounce 2s ease-in-out infinite;
            filter: drop-shadow(0 4px 12px fade(@error-color, 30%));
          }
        }

        .trophy-container {
          position: relative;

          .trophy-icon {
            width: 200px;
            height: 200px;
            animation: trophyShake 2s ease-in-out infinite;
            filter: drop-shadow(0 4px 12px fade(@warning-color, 30%));
          }
        }
      }

      .reward-text {
        margin-top: 120px;
        margin-bottom: 32px;

        .reward-title {
          font-size: @font-size-lg * 1.71;
          font-weight: 700;
          color: @text-color;
          margin: 0 0 12px 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .reward-message {
          font-size: @font-size-lg;
          color: @text-color-secondary;
          margin: 0 0 8px 0;
          line-height: @line-height-base;
        }

        .subject-name {
          font-size: @font-size-base;
          color: @text-color-secondary;
          font-weight: 500;
        }
      }

      .reward-button {
        width: 120px;
        height: 44px;
        border-radius: 22px;
        font-size: @font-size-lg;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
      }
    }

    /* 背景装饰效果 */
    .reward-bg-effects {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: @border-radius-xl;
      z-index: 1;

      .floating-particle {
        position: absolute;
        border-radius: 50%;
        animation: floatUp 4s linear infinite;
        opacity: 0;

        &.subject {
          background: radial-gradient(
            circle,
            @error-color,
            lighten(@error-color, 10%)
          );
        }

        &.all {
          background: radial-gradient(
            circle,
            @warning-color,
            lighten(@warning-color, 10%)
          );
        }
      }
    }
  }
  &.van-overlay {
    z-index: 1000;
  }
}

/* 动画定义 */
@keyframes flowerBounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  40% {
    transform: translateY(-10px) rotate(5deg);
  }
  60% {
    transform: translateY(-5px) rotate(-3deg);
  }
}

@keyframes trophyShake {
  0%,
  50%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-2deg) scale(1.05);
  }
  75% {
    transform: rotate(2deg) scale(1.05);
  }
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(100vh) rotate(0deg);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: @screen-xs) {
  .reward-overlay {
    .reward-modal {
      width: 95%;
      max-width: 300px;

      .reward-content {
        padding: 32px 20px 28px;
        min-height: 180px;

        .reward-icon {
          top: -35px;

          .flower-icon,
          .trophy-icon {
            width: 160px;
            height: 160px;
          }
        }

        .reward-text {
          margin-top: 100px;
          margin-bottom: 28px;

          .reward-title {
            font-size: @font-size-lg * 1.57;
          }

          .reward-message {
            font-size: @font-size-base * 1.07;
          }

          .subject-name {
            font-size: @font-size-sm * 1.08;
          }
        }

        .reward-button {
          width: 110px;
          height: 40px;
          font-size: @font-size-base * 1.07;
        }
      }
    }
  }
}
</style>
