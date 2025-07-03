import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// 引入移动端适配
import "lib-flexible/flexible";

// 引入触觉反馈插件
import { HapticPlugin } from "./utils/haptic";

// 引入科目 mixin
import subjectMixin from "./mixins/subject";

// 引入PWA安装提示组件
import PWAInstallPrompt from "./components/PWAInstallPrompt.vue";

// 全局注册科目 mixin
Vue.mixin(subjectMixin);

// 注册触觉反馈插件
Vue.use(HapticPlugin);

// 全局注册PWA安装提示组件
Vue.component("PWAInstallPrompt", PWAInstallPrompt);

// 引入Vant组件
import {
  Button,
  Cell,
  CellGroup,
  Checkbox,
  CheckboxGroup,
  Calendar,
  DatetimePicker,
  Picker,
  Swipe,
  SwipeItem,
  Toast,
  Dialog,
  ActionSheet,
  Popup,
  NavBar,
  Icon,
  Loading,
  Skeleton,
  PullRefresh,
  List,
  Tab,
  Tabs,
  Card,
  Progress,
  Circle,
  Empty,
  Grid,
  GridItem,
  Field,
  RadioGroup,
  Radio,
  Tag,
  Tabbar,
  TabbarItem,
  Overlay,
} from "vant";

// 注册Vant组件
Vue.use(Button);
Vue.use(Cell);
Vue.use(CellGroup);
Vue.use(Checkbox);
Vue.use(CheckboxGroup);
Vue.use(Calendar);
Vue.use(DatetimePicker);
Vue.use(Picker);
Vue.use(Swipe);
Vue.use(SwipeItem);
Vue.use(Toast);
Vue.use(Dialog);
Vue.use(ActionSheet);
Vue.use(Popup);
Vue.use(NavBar);
Vue.use(Icon);
Vue.use(Loading);
Vue.use(Skeleton);
Vue.use(PullRefresh);
Vue.use(List);
Vue.use(Tab);
Vue.use(Tabs);
Vue.use(Card);
Vue.use(Progress);
Vue.use(Circle);
Vue.use(Empty);
Vue.use(Grid);
Vue.use(GridItem);
Vue.use(Field);
Vue.use(RadioGroup);
Vue.use(Radio);
Vue.use(Tag);
Vue.use(Tabbar);
Vue.use(TabbarItem);
Vue.use(Overlay);

Vue.config.productionTip = false;

// Service Worker 注册和更新管理
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}

// Service Worker 注册函数
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service Worker 注册成功:", registration);

    // 设置更新检测
    setupUpdateDetection(registration);

    // 监听 Service Worker 消息
    setupServiceWorkerMessageListener();

    // 定期检查更新（每30分钟）
    setInterval(() => {
      registration.update();
    }, 30 * 60 * 1000);
  } catch (error) {
    console.error("❌ Service Worker 注册失败:", error);
  }
}

// 设置更新检测
function setupUpdateDetection(registration) {
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    console.log("🔄 发现新版本 Service Worker");

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed") {
        if (navigator.serviceWorker.controller) {
          // 有旧版本，显示更新提示
          showUpdatePrompt(newWorker);
        } else {
          // 首次安装
          console.log("🎉 Service Worker 首次安装完成");
        }
      }
    });
  });
}

// 显示更新提示
function showUpdatePrompt(newWorker) {
  Vue.prototype.$dialog
    .confirm({
      title: "发现新版本",
      message: `
      <div style="text-align: left; padding: 10px 0;">
        <p>🎉 应用有新版本可用！</p>
        <p>📱 更新后将获得最新功能和性能优化</p>
        <br>
        <p style="color: #999; font-size: 12px;">💡 提示：更新会刷新页面，请确保数据已保存</p>
      </div>
    `,
      confirmButtonText: "立即更新",
      cancelButtonText: "稍后提醒",
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      lockScroll: true,
      closeOnClickOverlay: false,
    })
    .then(() => {
      // 用户选择立即更新
      updateServiceWorker(newWorker);
    })
    .catch(() => {
      // 用户选择稍后提醒，10分钟后再次提示
      setTimeout(() => {
        if (newWorker.state === "installed") {
          showUpdatePrompt(newWorker);
        }
      }, 10 * 60 * 1000);
    });
}

// 更新 Service Worker
function updateServiceWorker(newWorker) {
  // 显示更新进度
  const loadingToast = Vue.prototype.$toast.loading({
    message: "正在更新应用...",
    forbidClick: true,
    duration: 0,
  });

  // 发送跳过等待指令
  newWorker.postMessage({ type: "SKIP_WAITING" });

  // 监听 Service Worker 激活
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    loadingToast.clear();

    Vue.prototype.$toast.success({
      message: "更新成功！即将重新加载页面",
      duration: 1500,
      onClose: () => {
        window.location.reload();
      },
    });
  });
}

// 监听 Service Worker 消息
function setupServiceWorkerMessageListener() {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const { type, data } = event.data || {};

    switch (type) {
      case "SW_ACTIVATED":
        console.log(
          `🚀 Service Worker 已激活，版本: ${data?.version || "unknown"}`
        );
        break;

      case "SYNC_COMPLETE":
        Vue.prototype.$toast.success("数据同步完成");
        break;

      case "CACHE_CLEARED":
        if (data?.success) {
          Vue.prototype.$toast.success("缓存清理完成");
        } else {
          Vue.prototype.$toast.fail("缓存清理失败");
        }
        break;

      default:
        console.log("收到未知 Service Worker 消息:", type, data);
    }
  });
}

// PWA 显示模式检测
const isPWA =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (isPWA) {
  console.log("应用运行在PWA模式");
  // 可以在这里添加PWA特定的行为
}

// 全局添加触觉反馈到常用操作
Vue.mixin({
  methods: {
    // 增强的Toast提示，带触觉反馈
    $toastWithHaptic(options) {
      if (typeof options === "string") {
        options = { message: options };
      }

      // 根据类型选择不同的触觉反馈
      switch (options.type) {
        case "success":
          this.$haptic.success();
          break;
        case "fail":
        case "error":
          this.$haptic.error();
          break;
        case "warning":
          this.$haptic.warning();
          break;
        default:
          this.$haptic.light();
      }

      return this.$toast(options);
    },
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
