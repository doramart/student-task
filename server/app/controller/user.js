"use strict";

const Controller = require("egg").Controller;

class UserController extends Controller {
  /**
   * GET /api/users - 获取用户列表
   */
  async index() {
    const { ctx } = this;

    const { page = 1, pageSize = 10, keyword = "" } = ctx.query;
    const { page: validPage, pageSize: validPageSize } =
      ctx.helper.validatePagination(page, pageSize);

    // 模拟数据库查询
    const mockUsers = [
      {
        id: 1,
        username: "john",
        email: "john@example.com",
        status: "active",
        createdAt: "2023-01-01",
      },
      {
        id: 2,
        username: "jane",
        email: "jane@example.com",
        status: "active",
        createdAt: "2023-01-02",
      },
      {
        id: 3,
        username: "bob",
        email: "bob@example.com",
        status: "inactive",
        createdAt: "2023-01-03",
      },
      {
        id: 4,
        username: "alice",
        email: "alice@example.com",
        status: "active",
        createdAt: "2023-01-04",
      },
      {
        id: 5,
        username: "charlie",
        email: "charlie@example.com",
        status: "active",
        createdAt: "2023-01-05",
      },
    ];

    // 根据关键词过滤
    let filteredUsers = mockUsers;
    if (keyword) {
      filteredUsers = mockUsers.filter(
        (user) =>
          user.username.includes(keyword) || user.email.includes(keyword)
      );
    }

    const total = filteredUsers.length;
    const startIndex = (validPage - 1) * validPageSize;
    const endIndex = startIndex + validPageSize;
    const list = filteredUsers.slice(startIndex, endIndex);

    ctx.helper.paginate(list, total, validPage, validPageSize);
  }

  /**
   * GET /api/users/:id - 获取单个用户
   */
  async show() {
    const { ctx } = this;
    const { id } = ctx.params;

    // 参数验证
    if (!id || isNaN(parseInt(id))) {
      ctx.helper.fail("用户ID无效", 400);
      return;
    }

    // 模拟数据库查询
    const mockUser = {
      id: parseInt(id),
      username: `user${id}`,
      email: `user${id}@example.com`,
      status: "active",
      profile: {
        nickname: `用户${id}`,
        avatar: "https://via.placeholder.com/100",
        phone: "138****8888",
        address: "北京市朝阳区",
      },
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
    };

    ctx.helper.success(mockUser, "获取用户成功");
  }

  /**
   * POST /api/users - 创建用户
   */
  async create() {
    const { ctx } = this;

    // 参数验证规则
    const rule = {
      username: { type: "string", required: true, min: 3, max: 20 },
      email: { type: "email", required: true },
      password: { type: "string", required: true, min: 6, max: 20 },
      status: { type: "enum", values: ["active", "inactive"], required: false },
    };

    try {
      ctx.validate(rule);
    } catch (error) {
      ctx.helper.fail(`参数验证失败: ${error.message}`, 400);
      return;
    }

    const { username, email, password, status = "active" } = ctx.request.body;

    // 模拟创建用户
    const newUser = {
      id: ctx.helper.generateId(),
      username,
      email,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ctx.helper.success(newUser, "创建用户成功", 201);
  }

  /**
   * PUT /api/users/:id - 更新用户
   */
  async update() {
    const { ctx } = this;
    const { id } = ctx.params;

    // 参数验证
    if (!id || isNaN(parseInt(id))) {
      ctx.helper.fail("用户ID无效", 400);
      return;
    }

    // 参数验证规则
    const rule = {
      username: { type: "string", required: false, min: 3, max: 20 },
      email: { type: "email", required: false },
      status: { type: "enum", values: ["active", "inactive"], required: false },
    };

    try {
      ctx.validate(rule);
    } catch (error) {
      ctx.helper.fail(`参数验证失败: ${error.message}`, 400);
      return;
    }

    const updateData = ctx.request.body;

    // 模拟更新用户
    const updatedUser = {
      id: parseInt(id),
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    ctx.helper.success(updatedUser, "更新用户成功");
  }

  /**
   * DELETE /api/users/:id - 删除用户
   */
  async destroy() {
    const { ctx } = this;
    const { id } = ctx.params;

    // 参数验证
    if (!id || isNaN(parseInt(id))) {
      ctx.helper.fail("用户ID无效", 400);
      return;
    }

    // 模拟删除用户
    ctx.helper.success({ id: parseInt(id) }, "删除用户成功");
  }

  /**
   * GET /api/user/sub-accounts - 获取子账户列表
   */
  async getSubAccounts() {
    const { ctx } = this;

    try {
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      const user = await ctx.service.user.findById(userId);
      if (!user) {
        ctx.helper.fail("用户不存在", 404);
        return;
      }

      if (user.accountType !== "master") {
        ctx.helper.fail("只有主账户可以查看子账户", 403);
        return;
      }

      // 获取子账户详细信息
      const subAccounts = await ctx.model.User.find({
        _id: { $in: user.subAccounts },
      }).select("email nickname avatar status createdAt");

      ctx.helper.success(subAccounts, "获取子账户列表成功");
    } catch (error) {
      ctx.logger.error("获取子账户列表失败:", error);
      ctx.helper.fail("获取子账户列表失败", 500);
    }
  }

  /**
   * POST /api/user/sub-accounts - 添加子账户
   */
  async addSubAccount() {
    const { ctx } = this;

    // 参数验证
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
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      // 不能添加自己为子账户
      const currentUser = await ctx.service.user.findById(userId);
      if (currentUser.email.toLowerCase() === email.toLowerCase()) {
        ctx.helper.fail("不能添加自己为子账户", 400);
        return;
      }

      const subUser = await ctx.model.User.addSubAccount(userId, email);

      ctx.helper.success(
        {
          email: subUser.email,
          nickname: subUser.nickname,
          avatar: subUser.avatar,
          createdAt: subUser.createdAt,
        },
        "子账户添加成功"
      );
    } catch (error) {
      ctx.logger.error("添加子账户失败:", error);
      ctx.helper.fail(error.message || "添加子账户失败", 400);
    }
  }

  /**
   * POST /api/user/invite-sub-account - 发送子账户邀请
   */
  async inviteSubAccount() {
    const { ctx } = this;

    // 参数验证
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
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      // 不能邀请自己
      const currentUser = await ctx.service.user.findById(userId);
      if (currentUser.email.toLowerCase() === email.toLowerCase()) {
        ctx.helper.fail("不能邀请自己为子账户", 400);
        return;
      }

      const invitation = await ctx.model.User.inviteSubAccount(userId, email);

      // 发送邀请邮件
      try {
        const inviteLink = `${ctx.request.origin}/accept-invitation?token=${invitation.inviteToken}`;

        await ctx.service.mail.sendInviteEmail(email, {
          inviterName: currentUser.nickname || currentUser.email,
          inviteLink,
          expiresIn: "7天",
        });

        ctx.helper.success(
          {
            email: invitation.email,
            invitedAt: new Date(),
          },
          "邀请发送成功，请通知对方查收邮件"
        );
      } catch (mailError) {
        // 如果邮件发送失败，取消邀请
        await ctx.model.User.cancelInvitation(userId, email);
        ctx.logger.error("邀请邮件发送失败:", mailError);
        ctx.helper.fail("邀请邮件发送失败，请稍后重试", 500);
      }
    } catch (error) {
      ctx.logger.error("发送邀请失败:", error);
      ctx.helper.fail(error.message || "发送邀请失败", 400);
    }
  }

  /**
   * GET /api/user/pending-invitations - 获取待处理邀请列表
   */
  async getPendingInvitations() {
    const { ctx } = this;

    try {
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      const user = await ctx.service.user.findById(userId);
      if (!user) {
        ctx.helper.fail("用户不存在", 404);
        return;
      }

      if (user.accountType !== "master") {
        ctx.helper.fail("只有主账户可以查看邀请列表", 403);
        return;
      }

      // 清理过期邀请
      await ctx.model.User.cleanupExpiredInvitations();

      // 重新获取用户信息
      const updatedUser = await ctx.service.user.findById(userId);
      const pendingInvitations = updatedUser.pendingInvitations.filter(
        (inv) => inv.expiresAt > new Date()
      );

      ctx.helper.success(pendingInvitations, "获取邀请列表成功");
    } catch (error) {
      ctx.logger.error("获取邀请列表失败:", error);
      ctx.helper.fail("获取邀请列表失败", 500);
    }
  }

  /**
   * DELETE /api/user/pending-invitations/:email - 取消邀请
   */
  async cancelInvitation() {
    const { ctx } = this;
    const { email } = ctx.params;

    if (!email) {
      ctx.helper.fail("邮箱参数不能为空", 400);
      return;
    }

    try {
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      await ctx.model.User.cancelInvitation(userId, decodeURIComponent(email));

      ctx.helper.success(null, "邀请已取消");
    } catch (error) {
      ctx.logger.error("取消邀请失败:", error);
      ctx.helper.fail(error.message || "取消邀请失败", 400);
    }
  }

  /**
   * POST /api/user/accept-invitation - 接受邀请
   */
  async acceptInvitation() {
    const { ctx } = this;

    // 参数验证
    const rule = {
      token: { type: "string", required: true },
    };

    try {
      ctx.validate(rule);
    } catch (error) {
      ctx.helper.fail(`参数验证失败: ${error.message}`, 400);
      return;
    }

    const { token } = ctx.request.body;

    try {
      const subUser = await ctx.model.User.acceptInvitation(token);

      ctx.helper.success(
        {
          email: subUser.email,
          nickname: subUser.nickname,
          accountType: subUser.accountType,
        },
        "邀请接受成功，您已成为子账户"
      );
    } catch (error) {
      ctx.logger.error("接受邀请失败:", error);
      ctx.helper.fail(error.message || "接受邀请失败", 400);
    }
  }

  /**
   * DELETE /api/user/sub-accounts/:email - 删除子账户
   */
  async removeSubAccount() {
    const { ctx } = this;
    const { email } = ctx.params;

    if (!email) {
      ctx.helper.fail("邮箱参数不能为空", 400);
      return;
    }

    try {
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      await ctx.model.User.removeSubAccount(userId, decodeURIComponent(email));

      ctx.helper.success(null, "子账户删除成功");
    } catch (error) {
      ctx.logger.error("删除子账户失败:", error);
      ctx.helper.fail(error.message || "删除子账户失败", 400);
    }
  }

  /**
   * GET /api/user/account-info - 获取账户关系信息
   */
  async getAccountInfo() {
    const { ctx } = this;

    try {
      // 从session或token中获取当前用户ID
      const userId = ctx.session.userId || ctx.state.user?.userId;
      if (!userId) {
        ctx.helper.fail("用户未登录", 401);
        return;
      }

      const user = await ctx.service.user.findById(userId);
      if (!user) {
        ctx.helper.fail("用户不存在", 404);
        return;
      }

      let accountInfo = {
        accountType: user.accountType,
        email: user.email,
        nickname: user.nickname,
      };

      if (user.accountType === "master") {
        // 主账户返回子账户数量
        accountInfo.subAccountsCount = user.subAccounts.length;
      } else {
        // 子账户返回主账户信息
        if (user.masterId) {
          const masterUser = await ctx.service.user.findById(user.masterId);
          if (masterUser) {
            accountInfo.masterAccount = {
              email: masterUser.email,
              nickname: masterUser.nickname,
            };
          }
        }
      }

      ctx.helper.success(accountInfo, "获取账户信息成功");
    } catch (error) {
      ctx.logger.error("获取账户信息失败:", error);
      ctx.helper.fail("获取账户信息失败", 500);
    }
  }
}

module.exports = UserController;
