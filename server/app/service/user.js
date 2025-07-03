"use strict";

const Service = require("egg").Service;

/**
 * 用户服务类
 * 负责处理所有与用户相关的数据库操作和业务逻辑
 * 包括用户的创建、查询、更新、删除等功能
 *
 * @class UserService
 * @extends {Service}
 */
class UserService extends Service {
  /**
   * 根据邮箱查找或创建用户
   * @param {string} email - 用户邮箱
   * @returns {Promise<User>} 用户对象
   */
  async findOrCreateByEmail(email) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const normalizedEmail = email.toLowerCase();
      const user = await User.findOrCreate(normalizedEmail);
      return user;
    } catch (error) {
      ctx.logger.error("查找或创建用户失败:", error);
      throw new Error("用户操作失败");
    }
  }

  /**
   * 根据用户ID查找用户
   * @param {string} userId - 用户ID
   * @returns {Promise<User|null>} 用户对象或null
   */
  async findById(userId) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      ctx.logger.error("根据ID查找用户失败:", error);
      throw new Error("查找用户失败");
    }
  }

  /**
   * 更新用户登录信息
   * @param {string|User} userOrId - 用户ID或用户对象
   * @returns {Promise<User>} 更新后的用户对象
   */
  async updateLoginInfo(userOrId) {
    const { ctx } = this;

    try {
      let user;

      // 如果传入的是用户对象
      if (typeof userOrId === "object" && userOrId._id) {
        user = userOrId;
      } else {
        // 如果传入的是用户ID，需要先查询
        user = await this.findById(userOrId);
        if (!user) {
          throw new Error("用户不存在");
        }
      }

      await user.updateLoginInfo();
      return user;
    } catch (error) {
      ctx.logger.error("更新登录信息失败:", error);
      throw new Error("更新登录信息失败");
    }
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 用户邮箱
   * @returns {Promise<User|null>} 用户对象或null
   */
  async findByEmail(email) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const normalizedEmail = email.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      return user;
    } catch (error) {
      ctx.logger.error("根据邮箱查找用户失败:", error);
      throw new Error("查找用户失败");
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.email - 邮箱
   * @param {string} userData.nickname - 昵称（可选）
   * @param {string} userData.avatar - 头像（可选）
   * @returns {Promise<User>} 新创建的用户对象
   */
  async create(userData) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const normalizedEmail = userData.email.toLowerCase();
      const user = new User({
        email: normalizedEmail,
        nickname: userData.nickname || normalizedEmail.split("@")[0],
        avatar: userData.avatar || "",
      });

      await user.save();
      return user;
    } catch (error) {
      ctx.logger.error("创建用户失败:", error);
      if (error.code === 11000) {
        throw new Error("邮箱已被注册");
      }
      throw new Error("创建用户失败");
    }
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 要更新的数据
   * @returns {Promise<User>} 更新后的用户对象
   */
  async updateById(userId, updateData) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!user) {
        throw new Error("用户不存在");
      }

      return user;
    } catch (error) {
      ctx.logger.error("更新用户信息失败:", error);
      throw new Error("更新用户信息失败");
    }
  }

  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteById(userId) {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const result = await User.findByIdAndDelete(userId);
      return !!result;
    } catch (error) {
      ctx.logger.error("删除用户失败:", error);
      throw new Error("删除用户失败");
    }
  }

  /**
   * 检查用户是否存在
   * @param {string} email - 用户邮箱
   * @returns {Promise<boolean>} 用户是否存在
   */
  async exists(email) {
    const { ctx } = this;

    try {
      const user = await this.findByEmail(email);
      return !!user;
    } catch (error) {
      ctx.logger.error("检查用户是否存在失败:", error);
      return false;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 用户统计信息
   */
  async getStats() {
    const { ctx } = this;
    const User = ctx.model.User;

    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      return {
        totalUsers,
        activeUsers,
      };
    } catch (error) {
      ctx.logger.error("获取用户统计信息失败:", error);
      throw new Error("获取统计信息失败");
    }
  }
}

module.exports = UserService;
