/**
 * 触觉反馈工具
 * 为移动端应用提供类原生的触觉反馈体验
 */

// 检查设备是否支持振动
const isVibrationSupported = () => {
  return "vibrate" in navigator || "webkitVibrate" in navigator;
};

// 安全执行振动
const safeVibrate = (pattern) => {
  try {
    if (isVibrationSupported()) {
      if (navigator.vibrate) {
        return navigator.vibrate(pattern);
      } else if (navigator.webkitVibrate) {
        return navigator.webkitVibrate(pattern);
      }
    }
    return false;
  } catch (error) {
    console.warn("触觉反馈执行失败:", error);
    return false;
  }
};

export const hapticFeedback = {
  /**
   * 轻微反馈 - 用于轻点、选择等操作
   */
  light() {
    return safeVibrate(20);
  },

  /**
   * 中等反馈 - 用于按钮点击、完成任务等操作
   */
  medium() {
    return safeVibrate(50);
  },

  /**
   * 强烈反馈 - 用于重要操作、错误提示等
   */
  heavy() {
    return safeVibrate([100, 50, 100]);
  },

  /**
   * 成功反馈 - 用于成功完成操作
   */
  success() {
    return safeVibrate([50, 30, 50]);
  },

  /**
   * 警告反馈 - 用于警告提示
   */
  warning() {
    return safeVibrate([80, 40, 80, 40, 80]);
  },

  /**
   * 错误反馈 - 用于错误提示
   */
  error() {
    return safeVibrate([150, 100, 150]);
  },

  /**
   * 自定义振动模式
   * @param {number|number[]} pattern - 振动模式，数字或数组
   */
  custom(pattern) {
    return safeVibrate(pattern);
  },

  /**
   * 停止振动
   */
  stop() {
    return safeVibrate(0);
  },

  /**
   * 检查是否支持触觉反馈
   */
  isSupported() {
    return isVibrationSupported();
  },
};

// Vue插件安装方法
export const HapticPlugin = {
  install(Vue) {
    Vue.prototype.$haptic = hapticFeedback;
    Vue.haptic = hapticFeedback;
  },
};

export default hapticFeedback;
