"use strict";

const Cache = require("js-cache");

module.exports = (app) => {
  // 应用启动完成
  app.beforeStart(async () => {
    console.log("🚀 Application is starting...");
  });

  // 应用启动成功
  app.ready(() => {
    console.log("✅ Application started successfully");

    // 初始化全局缓存实例，挂载到app对象上
    app.cache = new Cache();
    console.log("🔄 初始化全局缓存实例 (app.cache)");

    // 缓存设置 - 监听refreshCache事件
    app.messenger.on("refreshCache", (by) => {
      console.log("🔄 收到refreshCache事件:", by);
      const ctx = app.createAnonymousContext();
      ctx.runInBackground(async () => {
        const { key, value, time } = by;
        app.cache.set(key, value, time);
        console.log(`✅ 缓存设置成功: ${key}, 过期时间: ${time}ms`);
      });
    });

    // 缓存清除 - 监听clearCache事件
    app.messenger.on("clearCache", (by) => {
      console.log("🗑️ 收到clearCache事件:", by);
      const ctx = app.createAnonymousContext();
      ctx.runInBackground(async () => {
        const { key } = by;
        key && app.cache.del(key);
        console.log(`✅ 缓存清除成功: ${key}`);
      });
    });
  });

  // 应用即将关闭
  app.beforeClose(async () => {
    console.log("🛑 Application is shutting down...");

    // 清理缓存
    if (app.cache) {
      console.log("🔄 清理缓存实例");
      app.cache = null;
    }
  });
};
