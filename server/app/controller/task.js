"use strict";

const Controller = require("egg").Controller;
const dayjs = require("dayjs");

class TaskController extends Controller {
  // 检查任务是否已过期的辅助方法
  isTaskExpired(task) {
    const today = dayjs();

    if (task.deadline) {
      // 如果有截止日期，使用deadline判断
      const deadline = dayjs(task.deadline);
      return deadline.isBefore(today, "day");
    }
    // 如果没有截止日期，使用任务日期判断
    const taskDate = dayjs(task.date);
    return taskDate.isBefore(today, "day");
  }

  // 获取指定日期的任务
  async getTasks() {
    const { ctx } = this;
    const { date = dayjs().format("YYYY-MM-DD") } = ctx.query;

    console.log(`🎯 [CONTROLLER] getTasks 被调用`);
    console.log(`🎯 [CONTROLLER] ctx.state.user:`, ctx.state.user);
    console.log(`🎯 [CONTROLLER] 请求路径: ${ctx.path}`);
    console.log(`🎯 [CONTROLLER] 请求方法: ${ctx.method}`);

    try {
      // 从认证中间件获取用户ID
      const currentUser = ctx.state.user || {};
      const actualUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      console.log(`🎯 [CONTROLLER] 当前用户:`, currentUser);
      console.log(`🎯 [CONTROLLER] 实际使用的用户ID:`, actualUserId);

      // 验证日期格式
      if (!dayjs(date).isValid()) {
        ctx.helper.fail("日期格式无效", 400);
        return;
      }

      const tasks = await ctx.service.task.getTasksByDate(actualUserId, date);

      ctx.helper.success(tasks, "获取任务成功");
    } catch (error) {
      ctx.logger.error("获取任务失败:", error);
      ctx.helper.fail("获取任务失败: " + error.message, 500);
    }
  }

  // 创建任务
  async createTask() {
    const { ctx } = this;

    try {
      // 参数验证
      const rule = {
        title: { type: "string", required: true, max: 100 },
        description: { type: "string", required: false, max: 500 },
        subject: {
          type: "enum",
          values: ctx.app.config.custom.task.subjects,
          required: true,
        },
        date: { type: "string", required: true },
        deadline: { type: "string", required: false },
      };

      ctx.validate(rule);

      const {
        title,
        description = "",
        subject,
        date,
        deadline,
      } = ctx.request.body;

      // 从认证中间件获取用户ID
      const currentUser = ctx.state.user || {};
      const userId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      // 验证日期
      const taskDate = dayjs(date);
      if (!taskDate.isValid()) {
        ctx.helper.fail("日期格式无效", 400);
        return;
      }

      // 不允许创建过去的任务
      if (taskDate.isBefore(dayjs(), "day")) {
        ctx.helper.fail("不能创建过去日期的任务", 400);
        return;
      }

      // 创建任务
      const taskData = {
        userId,
        title: title.trim(),
        description: description.trim(),
        subject,
        date: taskDate.toDate(),
        deadline: deadline ? dayjs(deadline).toDate() : null,
        isCompleted: false,
      };

      const task = await ctx.service.task.createTask(taskData);

      ctx.helper.success(task, "任务创建成功");
    } catch (error) {
      ctx.logger.error("创建任务失败:", error);
      if (error.name === "ValidationError") {
        ctx.helper.fail("参数验证失败: " + error.message, 400);
      } else {
        ctx.helper.fail("创建任务失败: " + error.message, 500);
      }
    }
  }

  // 更新任务
  async updateTask() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const task = await ctx.service.task.getTaskById(id);
      if (!task) {
        ctx.helper.fail("任务不存在", 404);
        return;
      }

      // 权限检查 - 只能修改自己的任务
      const currentUser = ctx.state.user || {};
      const currentUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      if (task.userId.toString() !== currentUserId.toString()) {
        ctx.helper.fail("无权限操作此任务", 403);
        return;
      }

      // 权限检查 - 只能修改未到期的任务
      if (this.isTaskExpired(task)) {
        ctx.helper.fail("不能修改已过期的任务", 403);
        return;
      }

      const updates = ctx.request.body;

      // 验证更新字段
      const allowedFields = [
        "title",
        "description",
        "subject",
        "deadline",
        "isCompleted",
      ];
      const updateData = {};

      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateData[key] = updates[key];
        }
      });

      const updatedTask = await ctx.service.task.updateTask(id, updateData);

      ctx.helper.success(updatedTask, "任务更新成功");
    } catch (error) {
      ctx.logger.error("更新任务失败:", error);
      if (error.name === "ValidationError") {
        ctx.helper.fail("参数验证失败: " + error.message, 400);
      } else {
        ctx.helper.fail("更新任务失败: " + error.message, 500);
      }
    }
  }

  // 删除任务
  async deleteTask() {
    const { ctx } = this;
    const { id } = ctx.params;

    try {
      const task = await ctx.service.task.getTaskById(id);
      if (!task) {
        ctx.helper.fail("任务不存在", 404);
        return;
      }

      // 权限检查 - 只能删除自己的任务
      const currentUser = ctx.state.user || {};
      const currentUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      if (task.userId.toString() !== currentUserId.toString()) {
        ctx.helper.fail("无权限操作此任务", 403);
        return;
      }

      // 权限检查 - 只能删除未到期的任务
      if (this.isTaskExpired(task)) {
        ctx.helper.fail("不能删除已过期的任务", 403);
        return;
      }

      await ctx.service.task.deleteTask(id);

      ctx.helper.success(null, "任务删除成功");
    } catch (error) {
      ctx.logger.error("删除任务失败:", error);
      ctx.helper.fail("删除任务失败: " + error.message, 500);
    }
  }

  // 获取月度日历数据
  async getCalendarData() {
    const { ctx } = this;
    const { month } = ctx.query;

    try {
      // 从认证中间件获取用户ID
      const currentUser = ctx.state.user || {};
      const actualUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      // 解析月份参数 (格式: YYYY-MM)
      const monthDate = dayjs(month);
      if (!monthDate.isValid()) {
        ctx.helper.fail("月份格式无效，应为 YYYY-MM", 400);
        return;
      }

      const year = monthDate.year();
      const monthNum = monthDate.month() + 1;

      const calendarData = await ctx.service.task.getCalendarData(
        actualUserId,
        year,
        monthNum
      );

      ctx.helper.success(calendarData, "获取日历数据成功");
    } catch (error) {
      ctx.logger.error("获取日历数据失败:", error);
      ctx.helper.fail("获取日历数据失败: " + error.message, 500);
    }
  }

  // 获取统计数据
  async getStats() {
    const { ctx } = this;
    const { start, end } = ctx.query;

    try {
      // 从认证中间件获取用户ID
      const currentUser = ctx.state.user || {};
      const actualUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      // 验证日期参数
      const startDate = dayjs(start);
      const endDate = dayjs(end);

      if (!startDate.isValid() || !endDate.isValid()) {
        ctx.helper.fail("日期格式无效", 400);
        return;
      }

      if (startDate.isAfter(endDate)) {
        ctx.helper.fail("开始日期不能晚于结束日期", 400);
        return;
      }

      const stats = await ctx.service.task.getTaskStats(
        actualUserId,
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD")
      );

      ctx.helper.success(stats, "获取统计数据成功");
    } catch (error) {
      ctx.logger.error("获取统计数据失败:", error);
      ctx.helper.fail("获取统计数据失败: " + error.message, 500);
    }
  }

  // 获取连续完成天数
  async getStreak() {
    const { ctx } = this;

    try {
      // 从认证中间件获取用户ID
      const currentUser = ctx.state.user || {};
      const actualUserId =
        currentUser._id ||
        currentUser.id ||
        ctx.app.config.custom.task.defaultUserId;

      const streakDays = await ctx.service.task.getStreakDays(actualUserId);

      ctx.helper.success({ streak: streakDays }, "获取连续完成天数成功");
    } catch (error) {
      ctx.logger.error("获取连续完成天数失败:", error);
      ctx.helper.fail("获取连续完成天数失败: " + error.message, 500);
    }
  }

  // 批量更新任务状态
  async batchUpdateTasks() {
    const { ctx } = this;
    const { taskIds, updates } = ctx.request.body;

    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        ctx.helper.fail("任务ID列表不能为空", 400);
        return;
      }

      // 验证所有任务都未过期
      const tasks = await ctx.service.task.findTasks({ _id: { $in: taskIds } });

      for (const task of tasks) {
        if (this.isTaskExpired(task)) {
          ctx.helper.fail("不能修改已过期的任务", 403);
          return;
        }
      }

      // 批量更新
      const result = await ctx.service.task.batchUpdateTaskStatus(
        taskIds,
        updates
      );

      ctx.helper.success(
        {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        },
        "批量更新成功"
      );
    } catch (error) {
      ctx.logger.error("批量更新任务失败:", error);
      ctx.helper.fail("批量更新任务失败: " + error.message, 500);
    }
  }
}

module.exports = TaskController;
