"use strict";

const Controller = require("egg").Controller;

class HealthController extends Controller {
  async index() {
    const { ctx } = this;

    // 获取详细的缓存状态
    const cacheStats = ctx.service.cache.getCacheStats();

    // 生产环境输出更详细的缓存调试信息
    if (process.env.NODE_ENV === "production" && ctx.app.cache) {
      console.log("[HEALTH] 健康检查 - 详细缓存状态:", {
        appCacheExists: !!ctx.app.cache,
        cacheSize: ctx.app.cache.size(),
        cacheKeys: Object.keys(ctx.app.cache._cache || {}),
        cacheValues: Object.entries(ctx.app.cache._cache || {}).map(
          ([key, value]) => ({
            key,
            hasValue: !!value,
            valueType: typeof value,
            isExpired: value && value.expire && value.expire < Date.now(),
          })
        ),
      });
    }

    ctx.helper.success(
      {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        node_version: process.version,
        environment: ctx.app.config.env,
        memory: process.memoryUsage(),
        // 添加缓存状态信息（用于监控缓存问题）
        cache: cacheStats,
        // 额外的应用级缓存信息
        appCache: {
          initialized: !!ctx.app.cache,
          size: ctx.app.cache ? ctx.app.cache.size() : 0,
          keys: ctx.app.cache ? Object.keys(ctx.app.cache._cache || {}) : [],
        },
      },
      "Service is healthy"
    );
  }
}

module.exports = HealthController;
