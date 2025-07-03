"use strict";

const request = require("request-promise-native");

module.exports = {
  /**
   * 发送HTTP GET请求
   * @param {string} url 请求地址
   * @param {Object} options 请求选项
   */
  async httpGet(url, options = {}) {
    const defaultOptions = {
      method: "GET",
      uri: url,
      json: true,
      timeout: this.app.config.httpRequest.timeout,
      headers: {
        ...this.app.config.httpRequest.headers,
        ...options.headers,
      },
    };

    try {
      return await request({ ...defaultOptions, ...options });
    } catch (error) {
      this.app.logger.error("HTTP GET request failed:", error.message);
      throw error;
    }
  },

  /**
   * 发送HTTP POST请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   */
  async httpPost(url, data = {}, options = {}) {
    const defaultOptions = {
      method: "POST",
      uri: url,
      body: data,
      json: true,
      timeout: this.app.config.httpRequest.timeout,
      headers: {
        ...this.app.config.httpRequest.headers,
        ...options.headers,
      },
    };

    try {
      return await request({ ...defaultOptions, ...options });
    } catch (error) {
      this.app.logger.error("HTTP POST request failed:", error.message);
      throw error;
    }
  },

  /**
   * 发送HTTP PUT请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   */
  async httpPut(url, data = {}, options = {}) {
    const defaultOptions = {
      method: "PUT",
      uri: url,
      body: data,
      json: true,
      timeout: this.app.config.httpRequest.timeout,
      headers: {
        ...this.app.config.httpRequest.headers,
        ...options.headers,
      },
    };

    try {
      return await request({ ...defaultOptions, ...options });
    } catch (error) {
      this.app.logger.error("HTTP PUT request failed:", error.message);
      throw error;
    }
  },

  /**
   * 发送HTTP DELETE请求
   * @param {string} url 请求地址
   * @param {Object} options 请求选项
   */
  async httpDelete(url, options = {}) {
    const defaultOptions = {
      method: "DELETE",
      uri: url,
      json: true,
      timeout: this.app.config.httpRequest.timeout,
      headers: {
        ...this.app.config.httpRequest.headers,
        ...options.headers,
      },
    };

    try {
      return await request({ ...defaultOptions, ...options });
    } catch (error) {
      this.app.logger.error("HTTP DELETE request failed:", error.message);
      throw error;
    }
  },
};
