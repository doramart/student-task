"use strict";

const Service = require("egg").Service;

class CacheService extends Service {
  constructor(ctx) {
    super(ctx);

    // 确保缓存实例存在
    if (!this.app.cache) {
      this.logger.error("❌ 缓存实例未初始化，请检查app.js中的cache初始化");
      throw new Error("Cache instance not initialized");
    }

    // 生产环境额外日志
    if (process.env.NODE_ENV === "production") {
      console.log(
        `[CACHE] CacheService初始化 - 缓存实例存在:`,
        !!this.app.cache
      );
    }
  }

  // 生成验证码
  generateVerifyCode() {
    const { length } = this.config.verifyCode;
    let code = "";
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  // 生成缓存键
  getCacheKey(email, type = "verify_code") {
    return `${type}:${email}`;
  }

  // 生成发送间隔控制键
  getSendIntervalKey(email) {
    return this.getCacheKey(email, "send_interval");
  }

  // 生成尝试次数控制键
  getTryCountKey(email) {
    return this.getCacheKey(email, "try_count");
  }

  // 设置验证码
  async setVerifyCode(email, code) {
    const key = this.getCacheKey(email);
    const { expireTime } = this.config.verifyCode;

    try {
      // 优先使用messenger方式设置缓存，确保多进程同步
      this.ctx.helper.setMemoryCache(key, code, expireTime);

      this.logger.info(
        `✅ 验证码已缓存: ${email}, 过期时间: ${expireTime}ms, 缓存key: ${key}`
      );

      // 生产环境额外日志
      if (process.env.NODE_ENV === "production") {
        console.log(
          `[CACHE] 验证码设置成功 - Email: ${email}, Code: ${code}, Key: ${key}, ExpireTime: ${expireTime}ms`
        );
      }

      return true;
    } catch (error) {
      this.logger.error(`❌ 验证码缓存失败: ${email}`, error);
      throw error;
    }
  }

  // 获取验证码
  async getVerifyCode(email) {
    const key = this.getCacheKey(email);

    try {
      // 直接从app.cache获取
      const code = this.app.cache.get(key);

      if (code) {
        this.logger.info(`✅ 验证码获取成功: ${email}, 缓存key: ${key}`);

        // 生产环境额外日志
        if (process.env.NODE_ENV === "production") {
          console.log(
            `[CACHE] 验证码获取成功 - Email: ${email}, Code: ${code}, Key: ${key}`
          );
        }
      } else {
        this.logger.warn(`⚠️ 验证码不存在或已过期: ${email}, 缓存key: ${key}`);

        // 生产环境额外日志 - 调试缓存丢失问题
        if (process.env.NODE_ENV === "production") {
          console.log(`[CACHE] 验证码不存在 - Email: ${email}, Key: ${key}`);
          console.log(`[CACHE] 当前缓存状态检查:`, {
            cacheInstance: !!this.app.cache,
            cacheKeys: Object.keys(this.app.cache._cache || {}),
            cacheSize: this.app.cache.size(),
          });
        }
      }

      return code;
    } catch (error) {
      this.logger.error(`❌ 验证码获取失败: ${email}`, error);
      return null;
    }
  }

  // 删除验证码
  async deleteVerifyCode(email) {
    const key = this.getCacheKey(email);

    try {
      // 使用messenger方式删除缓存
      this.ctx.helper.setMemoryCache(key, null);
      this.logger.info(`验证码已删除: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ 验证码删除失败: ${email}`, error);
      // 降级使用直接删除
      this.app.cache.del(key);
      return true;
    }
  }

  // 检查发送间隔
  async checkSendInterval(email) {
    const key = this.getSendIntervalKey(email);
    const lastSendTime = this.app.cache.get(key);
    const { sendInterval } = this.config.verifyCode;

    if (lastSendTime) {
      const now = Date.now();
      const timeDiff = now - lastSendTime;

      if (timeDiff < sendInterval) {
        const remainingTime = Math.ceil((sendInterval - timeDiff) / 1000);
        return {
          canSend: false,
          remainingTime,
          message: `请等待${remainingTime}秒后再试`,
        };
      }
    }

    return { canSend: true };
  }

  // 设置发送时间记录
  async setSendTime(email) {
    const key = this.getSendIntervalKey(email);
    const { sendInterval } = this.config.verifyCode;

    try {
      // 使用messenger方式设置缓存
      this.ctx.helper.setMemoryCache(key, Date.now(), sendInterval);
      return true;
    } catch (error) {
      this.logger.error(`❌ 发送时间记录失败: ${email}`, error);
      // 降级使用直接设置
      this.app.cache.set(key, Date.now(), sendInterval);
      return true;
    }
  }

  // 获取尝试次数
  async getTryCount(email) {
    const key = this.getTryCountKey(email);
    return this.app.cache.get(key) || 0;
  }

  // 增加尝试次数
  async increaseTryCount(email) {
    const key = this.getTryCountKey(email);
    const count = (this.app.cache.get(key) || 0) + 1;
    const { expireTime } = this.config.verifyCode;

    try {
      // 使用messenger方式设置缓存
      this.ctx.helper.setMemoryCache(key, count, expireTime);
      return count;
    } catch (error) {
      this.logger.error(`❌ 尝试次数增加失败: ${email}`, error);
      // 降级使用直接设置
      this.app.cache.set(key, count, expireTime);
      return count;
    }
  }

  // 重置尝试次数
  async resetTryCount(email) {
    const key = this.getTryCountKey(email);

    try {
      // 使用messenger方式删除缓存
      this.ctx.helper.setMemoryCache(key, null);
      return true;
    } catch (error) {
      this.logger.error(`❌ 尝试次数重置失败: ${email}`, error);
      // 降级使用直接删除
      this.app.cache.del(key);
      return true;
    }
  }

  // 验证验证码
  async verifyCode(email, inputCode) {
    // 开发环境测试验证码
    if (process.env.NODE_ENV !== "production" && inputCode === "000000") {
      this.logger.info(`开发环境测试验证码验证成功: ${email}`);
      return {
        success: true,
        message: "测试验证码验证成功",
      };
    }

    const storedCode = await this.getVerifyCode(email);

    if (!storedCode) {
      return {
        success: false,
        message: "验证码不存在或已过期",
      };
    }

    const tryCount = await this.increaseTryCount(email);
    const { maxTries } = this.config.verifyCode;

    if (tryCount > maxTries) {
      await this.deleteVerifyCode(email);
      return {
        success: false,
        message: "验证码尝试次数过多，请重新获取",
      };
    }

    if (storedCode !== inputCode) {
      return {
        success: false,
        message: `验证码错误，还可尝试${maxTries - tryCount}次`,
      };
    }

    // 验证成功，清理相关缓存
    await this.deleteVerifyCode(email);
    await this.resetTryCount(email);

    return {
      success: true,
      message: "验证码验证成功",
    };
  }

  // 清理过期缓存（可选，js-cache会自动清理）
  async cleanup() {
    // js-cache 自动处理过期清理
    this.logger.info("缓存清理完成");
    return true;
  }

  // 获取缓存状态信息（用于监控和调试）
  getCacheStats() {
    try {
      const stats = {
        cacheInstance: !!this.app.cache,
        cacheSize: this.app.cache ? this.app.cache.size() : 0,
        cacheKeys: this.app.cache
          ? Object.keys(this.app.cache._cache || {})
          : [],
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };

      this.logger.info("📊 缓存状态:", stats);
      return stats;
    } catch (error) {
      this.logger.error("获取缓存状态失败:", error);
      return null;
    }
  }
}

module.exports = CacheService;
