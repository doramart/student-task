"use strict";

/**
 * 错误处理中间件
 */
module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      // 记录错误日志
      ctx.app.emit("error", err, ctx);

      const status = err.status || 500;
      const message = status === 500 ? "Internal Server Error" : err.message;

      // 统一错误响应格式
      ctx.status = status;
      ctx.body = {
        code: status,
        success: false,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      };

      // 开发环境返回详细错误信息
      if (ctx.app.config.env === "local") {
        ctx.body.stack = err.stack;
      }
    }
  };
};
