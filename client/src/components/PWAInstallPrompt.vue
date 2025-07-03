<template>
  <van-popup v-model="showPrompt" position="bottom">
    <div class="pwa-install-prompt">
      <div class="prompt-header">
        <h3>安装应用到主屏幕</h3>
        <van-icon name="cross" @click="dismiss" />
      </div>

      <p>获得更快的访问和更好的体验</p>

      <div class="actions">
        <van-button @click="dismiss">稍后</van-button>
        <van-button type="primary" @click="install">安装</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script>
export default {
  name: "PWAInstallPrompt",
  data() {
    return {
      showPrompt: false,
      deferredPrompt: null,
    };
  },

  mounted() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showPrompt = true;
    });
  },

  methods: {
    async install() {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
      }
      this.showPrompt = false;
    },

    dismiss() {
      this.showPrompt = false;
    },
  },
};
</script>

<style lang="less" scoped>
.pwa-install-prompt {
  padding: @spacing-lg;

  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: @spacing-md;

    h3 {
      margin: 0;
      font-size: @font-size-lg;
    }
  }

  p {
    color: @text-color-secondary;
    margin-bottom: @spacing-lg;
  }

  .actions {
    display: flex;
    gap: @spacing-md;

    .van-button {
      flex: 1;
    }
  }
}
</style>
