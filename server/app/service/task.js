"use strict";

const Service = require("egg").Service;
const dayjs = require("dayjs");

class TaskService extends Service {
  /**
   * 获取账户组的用户ID列表（包含主账户和子账户）
   * @param {string} userId - 当前用户ID
   * @return {Promise<Array>} 账户组用户ID列表
   */
  async getAccountGroupIds(userId) {
    const { ctx } = this;

    try {
      const accountGroup = await ctx.model.User.getAccountGroup(userId);
      return accountGroup;
    } catch (error) {
      ctx.logger.error("获取账户组失败:", error);
      // 如果获取账户组失败，只返回当前用户ID
      return [userId];
    }
  }

  /**
   * 根据日期获取任务（支持账户组）
   * @param {string} userId - 用户ID
   * @param {string} date - 日期字符串
   * @return {Promise<Array>} 任务列表
   */
  async getTasksByDate(userId, date) {
    const { ctx } = this;
    const targetDate = dayjs(date);
    const startOfDay = targetDate.startOf("day").toDate();
    const endOfDay = targetDate.endOf("day").toDate();

    // 获取账户组的所有用户ID
    const accountGroupIds = await this.getAccountGroupIds(userId);

    return await ctx.model.Task.find({
      userId: { $in: accountGroupIds },
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: 1 });
  }

  /**
   * 获取月度日历数据
   * @param {string} userId - 用户ID
   * @param {number} year - 年份
   * @param {number} month - 月份
   * @return {Promise<Array>} 日历数据
   */
  async getCalendarData(userId, year, month) {
    const { ctx } = this;
    const startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    // 获取账户组的所有用户ID
    const accountGroupIds = await this.getAccountGroupIds(userId);

    const tasks = await ctx.model.Task.find({
      userId: { $in: accountGroupIds },
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).select("date isCompleted subject");

    // 按日期分组统计
    const calendarDataMap = {};

    tasks.forEach((task) => {
      const dateKey = dayjs(task.date).format("YYYY-MM-DD");

      if (!calendarDataMap[dateKey]) {
        calendarDataMap[dateKey] = {
          date: dateKey,
          total: 0,
          completed: 0,
          subjects: {},
        };
      }

      // 确保 subject 键存在
      if (!calendarDataMap[dateKey].subjects[task.subject]) {
        calendarDataMap[dateKey].subjects[task.subject] = {
          total: 0,
          completed: 0,
        };
      }

      calendarDataMap[dateKey].total++;
      calendarDataMap[dateKey].subjects[task.subject].total++;

      if (task.isCompleted) {
        calendarDataMap[dateKey].completed++;
        calendarDataMap[dateKey].subjects[task.subject].completed++;
      }
    });

    // 转换为数组格式并计算状态
    const calendarData = Object.values(calendarDataMap).map((dayData) => {
      let status;
      if (dayData.completed === dayData.total) {
        status = "completed"; // 全部完成
      } else if (dayData.completed > 0) {
        status = "partial"; // 部分完成
      } else {
        status = "pending"; // 未完成
      }

      return {
        date: dayData.date,
        total: dayData.total,
        completed: dayData.completed,
        status,
        subjects: dayData.subjects,
      };
    });

    return calendarData;
  }

  /**
   * 获取统计数据
   * @param {string} userId - 用户ID
   * @param {string} timeRange - 时间范围 ('week' | 'month')
   * @return {Promise<Object>} 统计数据
   */
  async getStatistics(userId, timeRange = "month") {
    const { ctx } = this;
    let startDate, endDate;
    const now = dayjs();

    switch (timeRange) {
      case "week":
        startDate = now.startOf("week").toDate();
        endDate = now.endOf("week").toDate();
        break;
      case "month":
      default:
        startDate = now.startOf("month").toDate();
        endDate = now.endOf("month").toDate();
        break;
    }

    // 获取账户组的所有用户ID
    const accountGroupIds = await this.getAccountGroupIds(userId);

    const pipeline = [
      {
        $match: {
          userId: { $in: accountGroupIds },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            subject: "$subject",
            completed: "$isCompleted",
          },
          count: { $sum: 1 },
        },
      },
    ];

    const results = await ctx.model.Task.aggregate(pipeline);

    // 组织统计数据
    const stats = {
      total: 0,
      completed: 0,
      subjects: {},
    };

    results.forEach((item) => {
      const { subject, completed } = item._id;
      const count = item.count;

      // 确保 subject 键存在
      if (!stats.subjects[subject]) {
        stats.subjects[subject] = { total: 0, completed: 0 };
      }

      stats.total += count;
      stats.subjects[subject].total += count;

      if (completed) {
        stats.completed += count;
        stats.subjects[subject].completed += count;
      }
    });

    // 计算完成率
    stats.completionRate =
      stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;

    Object.keys(stats.subjects).forEach((subject) => {
      const subjectStats = stats.subjects[subject];
      subjectStats.completionRate =
        subjectStats.total > 0
          ? ((subjectStats.completed / subjectStats.total) * 100).toFixed(1)
          : 0;
    });

    return stats;
  }

  /**
   * 获取连续完成天数
   * @param {string} userId - 用户ID
   * @return {Promise<number>} 连续完成天数
   */
  async getStreakDays(userId) {
    const { ctx } = this;
    const today = dayjs();
    let currentDate = today;
    let streakDays = 0;
    let dayCount = 0; // 防止无限循环的计数器

    // 获取账户组的所有用户ID
    const accountGroupIds = await this.getAccountGroupIds(userId);

    try {
      // 向前查找连续完成的天数
      while (dayCount < 30) {
        const startOfDay = currentDate.startOf("day").toDate();
        const endOfDay = currentDate.endOf("day").toDate();

        // 查询当天的任务
        const dayTasks = await ctx.model.Task.find({
          userId: { $in: accountGroupIds },
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        if (dayTasks.length === 0) {
          // 如果当天没有任务，中断连续计数
          break;
        }

        const allCompleted = dayTasks.every((task) => task.isCompleted);

        if (allCompleted) {
          streakDays++;
          currentDate = currentDate.subtract(1, "day");
        } else {
          // 如果当天有未完成的任务，中断连续计数
          break;
        }

        dayCount++;
      }

      return streakDays;
    } catch (error) {
      ctx.logger.error("获取连续完成天数失败:", error);
      return 0;
    }
  }

  /**
   * 根据日期范围获取任务统计数据
   * @param {string} userId - 用户ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @return {Promise<Object>} 统计数据
   */
  async getTaskStats(userId, startDate, endDate) {
    const { ctx } = this;
    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // 确保userId是字符串类型
    const userIdStr = userId ? userId.toString() : userId;

    const pipeline = [
      {
        $match: {
          userId: userIdStr,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            subject: "$subject",
            completed: "$isCompleted",
          },
          count: { $sum: 1 },
        },
      },
    ];

    const results = await ctx.model.Task.aggregate(pipeline);

    // 组织统计数据
    const stats = {
      total: 0,
      completed: 0,
      subjects: {},
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    results.forEach((item) => {
      const { subject, completed } = item._id;
      const count = item.count;

      // 确保 subject 键存在
      if (!stats.subjects[subject]) {
        stats.subjects[subject] = { total: 0, completed: 0 };
      }

      stats.total += count;
      stats.subjects[subject].total += count;

      if (completed) {
        stats.completed += count;
        stats.subjects[subject].completed += count;
      }
    });

    // 计算完成率
    stats.completionRate =
      stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;

    Object.keys(stats.subjects).forEach((subject) => {
      const subjectStats = stats.subjects[subject];
      subjectStats.completionRate =
        subjectStats.total > 0
          ? ((subjectStats.completed / subjectStats.total) * 100).toFixed(1)
          : 0;
    });

    return stats;
  }

  /**
   * 批量更新任务
   * @param {Array} updates - 更新数据数组，每个元素包含 {id, data}
   * @return {Promise<Object>} 批量操作结果
   */
  async batchUpdateTasks(updates) {
    const { ctx } = this;
    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: {
          ...update.data,
          updatedAt: new Date(),
        },
      },
    }));

    return await ctx.model.Task.bulkWrite(operations);
  }

  /**
   * 创建任务
   * @param {Object} taskData - 任务数据
   * @return {Promise<Object>} 创建的任务
   */
  async createTask(taskData) {
    const { ctx } = this;
    const task = new ctx.model.Task(taskData);
    return await task.save();
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updateData - 更新数据
   * @return {Promise<Object>} 更新后的任务
   */
  async updateTask(taskId, updateData) {
    const { ctx } = this;

    // 特殊处理完成状态
    if ("isCompleted" in updateData) {
      if (updateData.isCompleted) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    updateData.updatedAt = new Date();

    return await ctx.model.Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteTask(taskId) {
    const { ctx } = this;
    return await ctx.model.Task.findByIdAndDelete(taskId);
  }

  /**
   * 根据ID获取任务
   * @param {string} taskId - 任务ID
   * @return {Promise<Object>} 任务对象
   */
  async getTaskById(taskId) {
    const { ctx } = this;
    return await ctx.model.Task.findById(taskId);
  }

  /**
   * 根据条件查找任务
   * @param {Object} condition - 查询条件
   * @return {Promise<Array>} 任务列表
   */
  async findTasks(condition) {
    const { ctx } = this;
    return await ctx.model.Task.find(condition);
  }

  /**
   * 批量更新多个任务状态
   * @param {Array} taskIds - 任务ID数组
   * @param {Object} updateData - 更新数据
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateTaskStatus(taskIds, updateData) {
    const { ctx } = this;

    // 特殊处理完成状态
    if ("isCompleted" in updateData) {
      if (updateData.isCompleted) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    updateData.updatedAt = new Date();

    return await ctx.model.Task.updateMany(
      { _id: { $in: taskIds } },
      updateData
    );
  }
}

module.exports = TaskService;
