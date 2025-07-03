"use strict";

module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema(
    {
      // 邮箱 - 唯一标识
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "请输入有效的邮箱地址",
        ],
      },
      // 昵称
      nickname: {
        type: String,
        default: function () {
          // 默认使用邮箱前缀作为昵称
          return this.email ? this.email.split("@")[0] : "用户";
        },
        trim: true,
        maxlength: 50,
      },
      // 头像URL
      avatar: {
        type: String,
        default: "",
      },
      // 用户状态
      status: {
        type: String,
        enum: ["active", "inactive", "banned"],
        default: "active",
      },
      // 账户类型
      accountType: {
        type: String,
        enum: ["master", "sub"],
        default: "master",
      },
      // 主账户ID（仅子账户需要）
      masterId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      // 子账户列表（仅主账户需要）
      subAccounts: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      // 待处理的邀请列表（仅主账户需要）
      pendingInvitations: [
        {
          email: {
            type: String,
            required: true,
            lowercase: true,
          },
          inviteToken: {
            type: String,
            required: true,
          },
          invitedAt: {
            type: Date,
            default: Date.now,
          },
          expiresAt: {
            type: Date,
            default: function () {
              return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天过期
            },
          },
        },
      ],
      // 最后登录时间
      lastLoginAt: {
        type: Date,
        default: null,
      },
      // 登录次数
      loginCount: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true, // 自动添加 createdAt 和 updatedAt
      collection: "users",
    }
  );

  // 创建索引
  UserSchema.index({ email: 1 }, { unique: true });
  UserSchema.index({ createdAt: -1 });

  // 实例方法：更新最后登录时间
  UserSchema.methods.updateLoginInfo = function () {
    this.lastLoginAt = new Date();
    this.loginCount += 1;
    return this.save();
  };

  // 静态方法：根据邮箱查找或创建用户
  UserSchema.statics.findOrCreate = async function (
    email,
    additionalData = {}
  ) {
    let user = await this.findOne({ email });

    if (!user) {
      user = new this({
        email,
        ...additionalData,
      });
      await user.save();
    }

    return user;
  };

  // 静态方法：添加子账户
  UserSchema.statics.addSubAccount = async function (
    masterUserId,
    subUserEmail
  ) {
    const User = this;

    // 查找主账户
    const masterUser = await User.findById(masterUserId);
    if (!masterUser) {
      throw new Error("主账户不存在");
    }

    if (masterUser.accountType !== "master") {
      throw new Error("只有主账户可以添加子账户");
    }

    // 查找或创建子账户
    let subUser = await User.findOne({ email: subUserEmail.toLowerCase() });

    if (subUser) {
      // 如果用户已存在，检查是否已经是其他账户的子账户
      if (
        subUser.accountType === "sub" &&
        subUser.masterId &&
        !subUser.masterId.equals(masterUserId)
      ) {
        throw new Error("该邮箱已经是其他主账户的子账户");
      }

      if (subUser.accountType === "master" && subUser.subAccounts.length > 0) {
        throw new Error("该邮箱已经是主账户，不能作为子账户");
      }

      // 如果已经是当前主账户的子账户，直接返回
      if (subUser.masterId && subUser.masterId.equals(masterUserId)) {
        return subUser;
      }
    } else {
      // 创建新的子账户
      subUser = new User({
        email: subUserEmail.toLowerCase(),
        accountType: "sub",
        masterId: masterUserId,
      });
      await subUser.save();
    }

    // 更新子账户信息
    subUser.accountType = "sub";
    subUser.masterId = masterUserId;
    await subUser.save();

    // 将子账户添加到主账户的子账户列表中
    if (!masterUser.subAccounts.includes(subUser._id)) {
      masterUser.subAccounts.push(subUser._id);
      await masterUser.save();
    }

    return subUser;
  };

  // 静态方法：发送子账户邀请
  UserSchema.statics.inviteSubAccount = async function (
    masterUserId,
    subUserEmail
  ) {
    const User = this;
    const crypto = require("crypto");

    // 查找主账户
    const masterUser = await User.findById(masterUserId);
    if (!masterUser) {
      throw new Error("主账户不存在");
    }

    if (masterUser.accountType !== "master") {
      throw new Error("只有主账户可以发送邀请");
    }

    const email = subUserEmail.toLowerCase();

    // 检查是否已经是子账户
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (
        existingUser.accountType === "sub" &&
        existingUser.masterId &&
        !existingUser.masterId.equals(masterUserId)
      ) {
        throw new Error("该邮箱已经是其他主账户的子账户");
      }

      if (
        existingUser.accountType === "master" &&
        existingUser.subAccounts.length > 0
      ) {
        throw new Error("该邮箱已经是主账户，不能作为子账户");
      }

      if (existingUser.masterId && existingUser.masterId.equals(masterUserId)) {
        throw new Error("该邮箱已经是您的子账户");
      }
    }

    // 检查是否已经有待处理的邀请
    const existingInvitation = masterUser.pendingInvitations.find(
      (inv) => inv.email === email && inv.expiresAt > new Date()
    );

    if (existingInvitation) {
      throw new Error("已经向该邮箱发送过邀请，请等待对方确认");
    }

    // 生成邀请token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // 添加到待处理邀请列表
    masterUser.pendingInvitations.push({
      email,
      inviteToken,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天过期
    });

    await masterUser.save();

    return { inviteToken, email };
  };

  // 静态方法：接受邀请
  UserSchema.statics.acceptInvitation = async function (inviteToken) {
    const User = this;

    // 查找包含此邀请token的主账户
    const masterUser = await User.findOne({
      "pendingInvitations.inviteToken": inviteToken,
      "pendingInvitations.expiresAt": { $gt: new Date() },
    });

    if (!masterUser) {
      throw new Error("邀请不存在或已过期");
    }

    // 找到具体的邀请
    const invitation = masterUser.pendingInvitations.find(
      (inv) => inv.inviteToken === inviteToken && inv.expiresAt > new Date()
    );

    if (!invitation) {
      throw new Error("邀请不存在或已过期");
    }

    const email = invitation.email;

    // 查找或创建被邀请用户
    let subUser = await User.findOne({ email });

    if (!subUser) {
      // 创建新用户
      subUser = new User({
        email,
        accountType: "sub",
        masterId: masterUser._id,
      });
      await subUser.save();
    } else {
      // 更新现有用户
      subUser.accountType = "sub";
      subUser.masterId = masterUser._id;
      await subUser.save();
    }

    // 添加到主账户的子账户列表
    if (!masterUser.subAccounts.includes(subUser._id)) {
      masterUser.subAccounts.push(subUser._id);
    }

    // 移除已处理的邀请
    masterUser.pendingInvitations = masterUser.pendingInvitations.filter(
      (inv) => inv.inviteToken !== inviteToken
    );

    await masterUser.save();

    return subUser;
  };

  // 静态方法：取消邀请
  UserSchema.statics.cancelInvitation = async function (masterUserId, email) {
    const User = this;

    const masterUser = await User.findById(masterUserId);
    if (!masterUser) {
      throw new Error("主账户不存在");
    }

    // 移除指定邮箱的邀请
    const originalLength = masterUser.pendingInvitations.length;
    masterUser.pendingInvitations = masterUser.pendingInvitations.filter(
      (inv) => inv.email !== email.toLowerCase()
    );

    if (masterUser.pendingInvitations.length === originalLength) {
      throw new Error("未找到该邮箱的邀请");
    }

    await masterUser.save();
    return true;
  };

  // 静态方法：清理过期邀请
  UserSchema.statics.cleanupExpiredInvitations = async function () {
    const User = this;

    await User.updateMany(
      { "pendingInvitations.expiresAt": { $lt: new Date() } },
      { $pull: { pendingInvitations: { expiresAt: { $lt: new Date() } } } }
    );
  };

  // 静态方法：移除子账户
  UserSchema.statics.removeSubAccount = async function (
    masterUserId,
    subUserEmail
  ) {
    const User = this;

    const masterUser = await User.findById(masterUserId);
    if (!masterUser) {
      throw new Error("主账户不存在");
    }

    const subUser = await User.findOne({ email: subUserEmail.toLowerCase() });
    if (!subUser) {
      throw new Error("子账户不存在");
    }

    if (!subUser.masterId || !subUser.masterId.equals(masterUserId)) {
      throw new Error("该子账户不属于当前主账户");
    }

    // 从主账户的子账户列表中移除
    masterUser.subAccounts = masterUser.subAccounts.filter(
      (id) => !id.equals(subUser._id)
    );
    await masterUser.save();

    // 将子账户转换为主账户
    subUser.accountType = "master";
    subUser.masterId = null;
    await subUser.save();

    return true;
  };

  // 静态方法：获取账户组（主账户+所有子账户）
  UserSchema.statics.getAccountGroup = async function (userId) {
    const User = this;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("用户不存在");
    }

    let accountGroup = [];

    if (user.accountType === "master") {
      // 如果是主账户，返回主账户和所有子账户
      accountGroup.push(user._id);
      accountGroup = accountGroup.concat(user.subAccounts);
    } else {
      // 如果是子账户，返回主账户和所有子账户（包括自己）
      if (user.masterId) {
        const masterUser = await User.findById(user.masterId);
        if (masterUser) {
          accountGroup.push(masterUser._id);
          accountGroup = accountGroup.concat(masterUser.subAccounts);
        }
      } else {
        // 如果子账户没有主账户ID，只返回自己
        accountGroup.push(user._id);
      }
    }

    return accountGroup;
  };

  // 转换为JSON时删除敏感信息
  UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    return {
      _id: obj._id,
      email: obj.email,
      nickname: obj.nickname,
      avatar: obj.avatar,
      status: obj.status,
      accountType: obj.accountType,
      masterId: obj.masterId,
      subAccounts: obj.subAccounts,
      lastLoginAt: obj.lastLoginAt,
      loginCount: obj.loginCount,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  };

  return mongoose.model("User", UserSchema);
};
