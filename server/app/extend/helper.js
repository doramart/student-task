"use strict";

module.exports = {
  /**
   * 成功响应
   * @param {*} data 响应数据
   * @param {string} message 响应消息
   * @param {number} code 响应码
   */
  success(data = null, message = "操作成功", code = 200) {
    this.ctx.status = code;
    this.ctx.body = {
      success: true,
      code,
      message,
      data,
      timestamp: Date.now(),
    };
  },

  /**
   * 失败响应
   * @param {string} message 错误消息
   * @param {number} code 错误码
   * @param {*} data 额外数据
   */
  fail(message = "操作失败", code = 500, data = null) {
    this.ctx.status = code;
    this.ctx.body = {
      success: false,
      code,
      message,
      data,
      timestamp: Date.now(),
    };
  },

  /**
   * 分页响应
   * @param {Array} list 数据列表
   * @param {number} total 总数
   * @param {number} page 当前页
   * @param {number} pageSize 每页大小
   * @param {string} message 响应消息
   */
  page(list = [], total = 0, page = 1, pageSize = 10, message = "获取成功") {
    this.ctx.body = {
      success: true,
      code: 200,
      message,
      data: {
        list,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / pageSize),
        },
      },
      timestamp: Date.now(),
    };
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   * @param {Date|string} date 日期
   * @return {string} 格式化后的日期字符串
   */
  formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  },

  /**
   * 验证日期格式
   * @param {string} dateStr 日期字符串
   * @return {boolean} 是否有效
   */
  isValidDate(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  },

  /**
   * 获取日期范围的开始和结束时间
   * @param {string} date 日期字符串 (YYYY-MM-DD)
   * @return {object} { start, end }
   */
  getDateRange(date) {
    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");
    return { start, end };
  },

  /**
   * 计算完成率
   * @param {number} completed 已完成数量
   * @param {number} total 总数量
   * @return {number} 完成率百分比
   */
  calculateCompletionRate(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  },

  /**
   * 生成随机ID
   */
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 验证分页参数
   * @param {number} page 页码
   * @param {number} pageSize 每页大小
   */
  validatePagination(page = 1, pageSize = 10) {
    const { pagination } = this.ctx.app.config.custom;

    page = Math.max(1, parseInt(page) || pagination.defaultPage);
    pageSize = Math.min(
      pagination.maxPageSize,
      Math.max(1, parseInt(pageSize) || pagination.defaultPageSize)
    );

    return { page, pageSize };
  },

  /**
   * 设置内存缓存
   * 使用messenger发送缓存操作事件，确保在多进程环境下缓存同步
   * @param {string} key 缓存键
   * @param {*} value 缓存值，如果为空则删除缓存
   * @param {number} time 过期时间（毫秒）
   */
  setMemoryCache(key, value, time) {
    if (value) {
      // 设置缓存
      this.app.messenger.sendToApp("refreshCache", {
        key,
        value,
        time,
      });
      console.log(`📤 发送refreshCache事件: ${key}, 过期时间: ${time}ms`);
    } else {
      // 删除缓存
      this.app.messenger.sendToApp("clearCache", {
        key,
      });
      console.log(`📤 发送clearCache事件: ${key}`);
    }
  },
};
