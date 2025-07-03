"use strict";

const Service = require("egg").Service;
const jwt = require("jsonwebtoken");

/**
 * JWT服务类
 * 负责JWT token的生成、验证和解析
 *
 * @class JwtService
 * @extends {Service}
 */
class JwtService extends Service {
  /**
   * 生成JWT token
   * @param {Object} payload - 要编码到token中的数据
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.email - 用户邮箱
   * @param {Object} options - 可选配置
   * @returns {Promise<string>} JWT token
   */
  async generateToken(payload, options = {}) {
    const { ctx } = this;
    const config = ctx.app.config.jwt;

    try {
      // 默认payload
      const defaultPayload = {
        iss: config.issuer, // 签发者
        iat: Math.floor(Date.now() / 1000), // 签发时间
      };

      // 合并payload
      const finalPayload = {
        ...defaultPayload,
        ...payload,
      };

      // 生成token配置
      const tokenOptions = {
        expiresIn: options.expiresIn || config.expiresIn,
        algorithm: config.algorithm,
      };

      const token = jwt.sign(finalPayload, config.secret, tokenOptions);

      ctx.logger.info(`JWT token生成成功，用户: ${payload.email}`);
      return token;
    } catch (error) {
      ctx.logger.error("JWT token生成失败:", error);
      throw new Error("Token生成失败");
    }
  }

  /**
   * 验证JWT token
   * @param {string} token - 要验证的token
   * @returns {Promise<Object|null>} 解析后的payload，验证失败返回null
   */
  async verifyToken(token) {
    const { ctx } = this;
    const config = ctx.app.config.jwt;

    try {
      if (!token) {
        return null;
      }

      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        issuer: config.issuer,
      });

      ctx.logger.debug(`JWT token验证成功，用户ID: ${decoded.userId}`);
      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        ctx.logger.warn("JWT token已过期:", error.message);
      } else if (error.name === "JsonWebTokenError") {
        ctx.logger.warn("JWT token无效:", error.message);
      } else {
        ctx.logger.error("JWT token验证失败:", error);
      }
      return null;
    }
  }

  /**
   * 解析token但不验证（用于获取过期token中的信息）
   * @param {string} token - 要解析的token
   * @returns {Object|null} 解析后的payload，解析失败返回null
   */
  decodeToken(token) {
    const { ctx } = this;

    try {
      if (!token) {
        return null;
      }

      const decoded = jwt.decode(token, { complete: true });
      return decoded ? decoded.payload : null;
    } catch (error) {
      ctx.logger.error("JWT token解析失败:", error);
      return null;
    }
  }

  /**
   * 刷新token（生成新的token）
   * @param {string} oldToken - 旧的token
   * @returns {Promise<string|null>} 新的token，刷新失败返回null
   */
  async refreshToken(oldToken) {
    const { ctx } = this;

    try {
      // 先解析旧token获取用户信息（即使过期也能解析）
      const decoded = this.decodeToken(oldToken);
      if (!decoded || !decoded.userId) {
        return null;
      }

      // 验证用户是否仍然存在且有效
      const user = await ctx.service.user.findById(decoded.userId);
      if (!user || user.status !== "active") {
        return null;
      }

      // 生成新token
      const newToken = await this.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      ctx.logger.info(`JWT token刷新成功，用户: ${user.email}`);
      return newToken;
    } catch (error) {
      ctx.logger.error("JWT token刷新失败:", error);
      return null;
    }
  }

  /**
   * 检查token是否即将过期（在过期前1小时）
   * @param {string} token - 要检查的token
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon(token) {
    const { ctx } = this;

    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true; // 无效token视为即将过期
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const oneHour = 3600; // 1小时 = 3600秒

      return timeUntilExpiry <= oneHour;
    } catch (error) {
      ctx.logger.error("检查token过期时间失败:", error);
      return true;
    }
  }

  /**
   * 从请求头中提取token
   * @param {Object} ctx - Egg.js上下文对象
   * @returns {string|null} 提取的token
   */
  extractTokenFromHeader(ctx) {
    const authorization = ctx.get("Authorization");

    if (!authorization) {
      return null;
    }

    const parts = authorization.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }
}

module.exports = JwtService;
