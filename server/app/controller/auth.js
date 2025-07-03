"use strict";

const Controller = require("egg").Controller;

class AuthController extends Controller {
  /**
   * 发送验证码
   */
  async sendCode() {
    const { ctx } = this;

    // 参数验证规则
    const rule = {
      email: { type: "email", required: true },
    };

    try {
      ctx.validate(rule);
    } catch (error) {
      ctx.helper.fail(`参数验证失败: ${error.message}`, 400);
      return;
    }

    const { email } = ctx.request.body;

    try {
      // 检查发送频率限制
      const intervalCheck = await ctx.service.cache.checkSendInterval(email);
      if (!intervalCheck.canSend) {
        ctx.helper.fail(intervalCheck.message, 429);
        return;
      }

      // 生成验证码
      const code = ctx.service.cache.generateVerifyCode();
      console.log("🚀 ~ AuthController ~ sendCode ~ code:", code)

      // 发送邮件
      const mailResult = await ctx.service.mail.sendVerifyCode(email, code);
      if (!mailResult.success) {
        ctx.helper.fail("邮件发送失败，请稍后重试", 500);
        return;
      }

      // 缓存验证码
      await ctx.service.cache.setVerifyCode(email, code);
      await ctx.service.cache.setSendTime(email);

      ctx.helper.success(
        {
          email,
          expiresIn: Math.floor(this.config.verifyCode.expireTime / 1000),
        },
        "验证码发送成功"
      );
    } catch (error) {
      ctx.logger.error("发送验证码失败:", error);
      ctx.helper.fail("系统错误，请稍后重试", 500);
    }
  }

  /**
   * 邮箱验证码登录
   */
  async login() {
    const { ctx } = this;

    // 参数验证规则
    const rule = {
      email: { type: "email", required: true },
      code: { type: "string", required: true, min: 6, max: 6 },
    };

    try {
      ctx.validate(rule);
    } catch (error) {
      ctx.helper.fail(`参数验证失败: ${error.message}`, 400);
      return;
    }

    const { email, code } = ctx.request.body;

    try {
      // 验证验证码
      const verifyResult = await ctx.service.cache.verifyCode(email, code);
      if (!verifyResult.success) {
        ctx.helper.fail(verifyResult.message, 400);
        return;
      }

      // 查找或创建用户
      const user = await ctx.service.user.findOrCreateByEmail(email);

      // 更新登录信息
      await ctx.service.user.updateLoginInfo(user);

      // 生成真实的JWT token
      const token = await ctx.service.jwt.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      // 设置session
      ctx.session.userId = user._id.toString();
      ctx.session.user = user.toJSON();

      // 设置cookie（可选，用于前端判断登录状态）
      ctx.cookies.set("user_id", user._id.toString(), {
        httpOnly: false, // 允许前端读取
        secure: false, // 开发环境
        maxAge: 7 * 24 * 3600 * 1000, // 7天
      });

      ctx.helper.success(
        {
          token,
          user: user.toJSON(),
        },
        "登录成功"
      );
    } catch (error) {
      ctx.logger.error("登录失败:", error);
      ctx.helper.fail("登录失败，请稍后重试", 500);
    }
  }

  /**
   * 获取用户信息
   */
  async profile() {
    const { ctx } = this;

    try {
      let user = null;

      // 优先从session获取用户信息
      if (ctx.session.userId) {
        user = await ctx.service.user.findById(ctx.session.userId);
      }

      // 如果session中没有，从中间件中获取（兼容旧的token方式）
      if (!user && ctx.state.user) {
        user = ctx.state.user;
      }

      if (!user) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      // 如果是从数据库查询的用户，返回完整信息
      if (user.toJSON) {
        ctx.helper.success(user.toJSON(), "获取用户信息成功");
      } else {
        // 兼容旧的硬编码用户数据
        ctx.helper.success(
          {
            id: user.id,
            username: user.username,
            email: user.email || "admin@example.com",
            role: user.role || "admin",
            lastLoginTime: new Date().toISOString(),
          },
          "获取用户信息成功"
        );
      }
    } catch (error) {
      ctx.logger.error("获取用户信息失败:", error);
      ctx.helper.fail("获取用户信息失败", 500);
    }
  }

  /**
   * 刷新token
   */
  async refreshToken() {
    const { ctx } = this;

    try {
      // 从请求头中获取旧token
      const oldToken = ctx.service.jwt.extractTokenFromHeader(ctx);

      if (!oldToken) {
        ctx.helper.fail("缺少token", 400);
        return;
      }

      // 刷新token
      const newToken = await ctx.service.jwt.refreshToken(oldToken);

      if (!newToken) {
        ctx.helper.fail("token刷新失败，请重新登录", 401);
        return;
      }

      ctx.helper.success(
        {
          token: newToken,
        },
        "token刷新成功"
      );
    } catch (error) {
      ctx.logger.error("刷新token失败:", error);
      ctx.helper.fail("刷新token失败", 500);
    }
  }

  /**
   * 退出登录
   */
  async logout() {
    const { ctx } = this;

    try {
      // 清除session
      ctx.session = null;

      // 清除cookie
      ctx.cookies.set("user_id", null, {
        maxAge: 0,
      });

      ctx.helper.success(null, "退出登录成功");
    } catch (error) {
      ctx.logger.error("退出登录失败:", error);
      ctx.helper.fail("退出登录失败", 500);
    }
  }

  // 缓存调试接口（仅生产环境用于调试）
  async debugCache() {
    const { ctx } = this;

    // 只在需要调试时开放，可以通过环境变量控制
    if (process.env.ENABLE_CACHE_DEBUG !== "true") {
      ctx.helper.error(null, "缓存调试接口未启用", 403);
      return;
    }

    try {
      const cacheStats = ctx.service.cache.getCacheStats();

      // 获取所有缓存键值详情
      const cacheDetail = {};
      if (ctx.app.cache && ctx.app.cache._cache) {
        Object.entries(ctx.app.cache._cache).forEach(([key, value]) => {
          cacheDetail[key] = {
            hasValue: !!value,
            valueType: typeof value?.value,
            actualValue: value?.value, // 注意：生产环境可能不应该显示实际值
            expire: value?.expire,
            isExpired: value?.expire && value.expire < Date.now(),
            remainingTTL: value?.expire
              ? Math.max(0, value.expire - Date.now())
              : null,
          };
        });
      }

      const debugInfo = {
        timestamp: new Date().toISOString(),
        cacheStats,
        cacheDetail,
        environment: ctx.app.config.env,
        processInfo: {
          pid: process.pid,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      };

      console.log("[CACHE DEBUG] 缓存调试信息:", debugInfo);

      ctx.helper.success(debugInfo, "缓存调试信息获取成功");
    } catch (error) {
      ctx.logger.error("获取缓存调试信息失败:", error);
      ctx.helper.error(error, "获取缓存调试信息失败");
    }
  }
}

module.exports = AuthController;
