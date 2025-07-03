"use strict";

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller } = app;

  // 健康检查接口（无需认证）
  router.get("/api/health", controller.health.index);

  // 认证相关接口
  router.post("/api/auth/send-code", controller.auth.sendCode); // 发送验证码
  router.post("/api/auth/login", controller.auth.login); // 邮箱验证码登录
  router.post("/api/auth/refresh-token", controller.auth.refreshToken); // 刷新token
  router.post("/api/auth/logout", controller.auth.logout); // 退出登录
  router.get("/api/auth/profile", controller.auth.profile); // 获取用户信息
  router.get("/api/auth/debug-cache", controller.auth.debugCache); // 缓存调试接口

  // 子账户管理接口
  router.get("/api/user/sub-accounts", controller.user.getSubAccounts); // 获取子账户列表
  router.post("/api/user/sub-accounts", controller.user.addSubAccount); // 添加子账户
  router.delete(
    "/api/user/sub-accounts/:email",
    controller.user.removeSubAccount
  ); // 删除子账户
  router.get("/api/user/account-info", controller.user.getAccountInfo); // 获取账户关系信息

  // 子账户邀请接口
  router.post("/api/user/invite-sub-account", controller.user.inviteSubAccount); // 发送子账户邀请
  router.get(
    "/api/user/pending-invitations",
    controller.user.getPendingInvitations
  ); // 获取待处理邀请列表
  router.delete(
    "/api/user/pending-invitations/:email",
    controller.user.cancelInvitation
  ); // 取消邀请
  router.post("/api/user/accept-invitation", controller.user.acceptInvitation); // 接受邀请

  // 任务管理接口 - RESTful API
  router.get("/api/tasks", controller.task.getTasks);
  router.post("/api/tasks", controller.task.createTask);
  router.patch("/api/tasks/:id", controller.task.updateTask);
  router.delete("/api/tasks/:id", controller.task.deleteTask);

  // 任务管理特殊接口
  router.get("/api/tasks/calendar", controller.task.getCalendarData);
  router.get("/api/tasks/stats", controller.task.getStats);
  router.get("/api/tasks/streak", controller.task.getStreak);
  router.patch("/api/tasks/batch", controller.task.batchUpdateTasks);

  // 用户管理接口示例 - RESTful API
  router.resources("users", "/api/users", controller.user);


  // SPA应用路由处理 - 将所有非API路径指向index.html
  router.get("/*", async (ctx) => {
    // 如果是API路径，跳过处理
    if (ctx.path.startsWith("/api/")) {
      return;
    }

    // 设置响应类型为HTML
    ctx.type = "html";

    // 返回index.html文件内容
    try {
      const fs = require("fs");
      const path = require("path");
      const indexPath = path.join(ctx.app.baseDir, "app/public/index.html");

      if (fs.existsSync(indexPath)) {
        ctx.body = fs.readFileSync(indexPath, "utf8");
      } else {
        ctx.status = 404;
        ctx.body = "index.html not found";
      }
    } catch (error) {
      ctx.logger.error("读取index.html失败:", error);
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  });
};
