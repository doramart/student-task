"use strict";

/**
 * 身份验证中间件
 * @param options
 */
module.exports = (options) => {
  return async function auth(ctx, next) {
    // API 认证忽略列表 - 不需要认证的API路径
    const apiIgnorePaths = [
      "/api/health",
      "/api/auth/login",
      "/api/auth/send-code",
      "/api/auth/refresh-token",
      "/api/auth/logout",
      "/api/user/accept-invitation",
      // "/api/auth/profile",
    ];

    // 静态资源路径模式
    const staticPaths = [
      "/index.html",
      "/favicon.ico",
      "/js/",
      "/css/",
      "/img/",
      "/fonts/",
      "/static/",
    ];

    // 判断是否为API请求
    const isApiRequest = ctx.path.startsWith("/api/");

    // 判断是否为静态资源
    const isStaticResource = staticPaths.some((path) =>
      ctx.path.startsWith(path)
    );

    // 判断是否为根路径
    const isRootPath = ctx.path === "/";

    // 判断是否为忽略的API路径
    const isIgnoredApi = apiIgnorePaths.some((path) =>
      ctx.path.startsWith(path)
    );

    // 不需要认证的情况：
    // 1. 根路径
    // 2. 静态资源
    // 3. 忽略的API路径
    // 4. 非API请求（前端SPA路由，由前端处理认证）
    const shouldIgnore =
      isRootPath || isStaticResource || isIgnoredApi || !isApiRequest;

    if (shouldIgnore) {
      await next();
      return;
    }

    console.log(`🚨 [AUTH中间件] 开始认证检查: ${ctx.path}`);

    let authenticated = false;
    let user = null;

    // 1. 优先检查Session认证
    if (ctx.session && ctx.session.userId) {
      try {
        const User = ctx.model.User;
        user = await User.findById(ctx.session.userId);

        if (user && user.status === "active") {
          authenticated = true;
          ctx.state.user = user.toJSON();
          ctx.logger.info(`Session认证成功: ${user.email}`);
        } else if (user && user.status !== "active") {
          ctx.logger.warn(
            `用户状态异常: ${user.email}, status: ${user.status}`
          );
        }
      } catch (error) {
        ctx.logger.error("Session认证失败:", error);
        // 清除无效session
        ctx.session = null;
      }
    }

    // 2. 如果Session认证失败，尝试Cookie认证
    if (!authenticated) {
      const userId = ctx.cookies.get("user_id");
      if (userId) {
        try {
          const User = ctx.model.User;
          user = await User.findById(userId);

          if (user && user.status === "active") {
            authenticated = true;
            ctx.state.user = user.toJSON();
            // 重新设置session
            ctx.session.userId = user._id.toString();
            ctx.session.user = user.toJSON();
            ctx.logger.info(`Cookie认证成功: ${user.email}`);
          }
        } catch (error) {
          ctx.logger.error("Cookie认证失败:", error);
          // 清除无效cookie
          ctx.cookies.set("user_id", null, { maxAge: 0 });
        }
      }
    }

    // 3. 如果前两种认证都失败，尝试JWT Token认证
    if (!authenticated) {
      const token = ctx.service.jwt.extractTokenFromHeader(ctx);

      if (token) {
        try {
          // 验证JWT token
          const decoded = await ctx.service.jwt.verifyToken(token);

          if (decoded && decoded.userId) {
            // 从数据库获取最新的用户信息
            const User = ctx.model.User;
            user = await User.findById(decoded.userId);

            if (user && user.status === "active") {
              authenticated = true;
              ctx.state.user = user.toJSON();
              // 重新设置session
              ctx.session.userId = user._id.toString();
              ctx.session.user = user.toJSON();
              ctx.state.token = token;
              ctx.logger.info(`JWT认证成功: ${user.email}`);

              // 检查token是否即将过期，如果是则在响应头中提醒前端刷新
              if (ctx.service.jwt.isTokenExpiringSoon(token)) {
                ctx.set("X-Token-Refresh-Needed", "true");
              }
            } else if (user && user.status !== "active") {
              ctx.logger.warn(
                `用户状态异常: ${user.email}, status: ${user.status}`
              );
            }
          }
        } catch (error) {
          ctx.logger.error("JWT认证失败:", error);
        }
      }
    }

    // 4. 如果所有认证方式都失败
    if (!authenticated) {
      ctx.logger.warn(`认证失败 - Path: ${ctx.path}, Method: ${ctx.method}`);

      // 根据请求类型处理认证失败
      const isApiRequest = ctx.path.startsWith("/api/");
      const acceptsJson = ctx.accepts(["json", "html"]) === "json";

      if (isApiRequest || acceptsJson) {
        // API请求或明确要求JSON响应 - 返回401错误，让客户端处理跳转
        ctx.status = 401;
        ctx.body = {
          success: false,
          message: "未授权访问",
          code: 401,
          redirectTo: "/login", // 提示客户端跳转地址
        };
        return;
      } else {
        // 页面请求 - 直接重定向到登录页面
        ctx.logger.info(`重定向到登录页面: ${ctx.path}`);
        ctx.redirect("/login");
        return;
      }
    }
    ctx.logger.info(
      `✅ [AUTH中间件] 认证成功，用户: ${
        ctx.state.user.email || ctx.state.user.username
      }`
    );
    await next();
  };
};
