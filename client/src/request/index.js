import axios from "axios";
import store from "@/store";
import { Toast } from "vant";

// 根据环境配置base URL
const getBaseURL = () => {
  // 判断是否为生产环境
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }

  // 开发环境，检查是否配置了自定义API地址
  if (process.env.VUE_APP_API_BASE_URL) {
    return process.env.VUE_APP_API_BASE_URL;
  }

  // 默认本地开发环境 - 更新为7801端口
  return "http://127.0.0.1:7801/api";
};

// 优化的全局 loading 管理
let loadingRequestCount = 0;
let loadingDelayTimer = null;
let loadingStartTime = 0;
let hideLoadingTimer = null;
let forceHideTimer = null;

const MIN_LOADING_TIME = 500; // 最小显示时间500ms
const LOADING_DELAY = 200; // 延迟显示时间200ms
const TOAST_DELAY = 300; // Toast显示前的延迟时间
const MAX_LOADING_TIME = 15000; // 最大loading时间15秒

// 显示全局 loading
const showLoading = () => {
  if (loadingRequestCount === 0) {
    // 清除可能存在的隐藏定时器
    if (hideLoadingTimer) {
      clearTimeout(hideLoadingTimer);
      hideLoadingTimer = null;
    }

    // 延迟显示loading，避免快速请求的闪现
    loadingDelayTimer = setTimeout(() => {
      if (loadingRequestCount > 0) {
        // 确保请求还在进行中
        store.commit("SET_LOADING", true);
        loadingStartTime = Date.now();

        // 设置强制隐藏定时器，防止loading卡住
        forceHideTimer = setTimeout(() => {
          console.warn("Loading timeout, force hiding...");
          loadingRequestCount = 0;
          store.commit("SET_LOADING", false);
          hideLoadingTimer = null;
          forceHideTimer = null;
        }, MAX_LOADING_TIME);
      } else {
        // 如果没有活跃请求了，确保loading状态为false
        if (store.state.loading) {
          store.commit("SET_LOADING", false);
        }
      }
      loadingDelayTimer = null;
    }, LOADING_DELAY);
  }
  loadingRequestCount++;
};

// 隐藏全局 loading
const hideLoading = () => {
  loadingRequestCount--;

  if (loadingRequestCount <= 0) {
    loadingRequestCount = 0;

    // 清除强制隐藏定时器
    if (forceHideTimer) {
      clearTimeout(forceHideTimer);
      forceHideTimer = null;
    }

    if (loadingDelayTimer) {
      // loading还没有显示，直接取消显示
      clearTimeout(loadingDelayTimer);
      loadingDelayTimer = null;

      // 确保store状态也是false
      if (store.state.loading) {
        store.commit("SET_LOADING", false);
      }
    } else if (store.state.loading) {
      // loading已经显示，确保最小显示时间
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      hideLoadingTimer = setTimeout(() => {
        store.commit("SET_LOADING", false);
        hideLoadingTimer = null;
      }, remainingTime);
    }
  }
};

// 强制重置loading状态的方法
const resetLoading = () => {
  loadingRequestCount = 0;

  // 清除所有定时器
  if (loadingDelayTimer) {
    clearTimeout(loadingDelayTimer);
    loadingDelayTimer = null;
  }
  if (hideLoadingTimer) {
    clearTimeout(hideLoadingTimer);
    hideLoadingTimer = null;
  }
  if (forceHideTimer) {
    clearTimeout(forceHideTimer);
    forceHideTimer = null;
  }

  // 重置状态
  store.commit("SET_LOADING", false);
};

// 开发环境下暴露重置方法，便于调试
if (process.env.NODE_ENV === "development") {
  window.resetLoading = resetLoading;
}

// 优化的Toast显示（延迟显示，避免与loading冲突）
const showToast = (type, message) => {
  setTimeout(() => {
    if (type === "success") {
      Toast.success(message);
    } else if (type === "fail") {
      Toast.fail(message);
    } else {
      Toast(message);
    }
  }, TOAST_DELAY);
};

// 创建axios实例
const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 允许携带cookie
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 显示全局 loading
    showLoading();

    // 添加Authorization头（如果有token）
    const token = store.state.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // 请求失败也要隐藏 loading
    hideLoading();
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  async (response) => {
    // 隐藏全局 loading
    hideLoading();

    // 检查是否需要刷新token
    const needRefresh = response.headers["x-token-refresh-needed"];
    if (needRefresh === "true" && store.state.token) {
      try {
        console.log("🔄 Token即将过期，正在自动刷新...");
        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${store.state.token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        if (refreshResponse.data && refreshResponse.data.success) {
          const newToken = refreshResponse.data.data.token;
          store.commit("SET_TOKEN", newToken);
          console.log("✅ Token刷新成功");
        }
      } catch (error) {
        console.warn("⚠️ Token刷新失败，可能需要重新登录:", error);
        // 刷新失败时不强制登出，让用户继续操作
      }
    }

    const { data } = response;

    if (data.success) {
      return data;
    } else {
      // 显示错误提示（延迟显示）
      showToast("fail", data.message || "请求失败");
      throw new Error(data.message || "请求失败");
    }
  },
  (error) => {
    // 隐藏全局 loading
    hideLoading();

    console.error("API Error:", error);

    // 更详细的错误处理
    let message = "网络错误";

    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response;
      switch (status) {
        case 400:
          message = data?.message || "请求参数错误";
          break;
        case 401:
          message = "未授权，请重新登录";
          // 清除登录状态并跳转到登录页
          store.commit("CLEAR_AUTH");
          // 使用动态导入避免循环依赖
          import("@/router").then(({ default: router }) => {
            if (router.currentRoute.path !== "/login") {
              router.push("/login");
            }
          });
          break;
        case 403:
          message = "没有权限执行此操作";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        default:
          message = data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      message = "无法连接到服务器，请检查网络";
    } else {
      // 其他错误
      message = error.message || "请求配置错误";
    }

    // 显示错误提示（延迟显示）
    showToast("fail", message);
    throw new Error(message);
  }
);

// 导出配置好的axios实例和工具方法
export default request;

// 导出工具方法供其他模块使用
export { resetLoading, showToast, getBaseURL };
