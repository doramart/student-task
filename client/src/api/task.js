import request from "@/request";

// 任务API
export default {
  // 获取指定日期的任务
  async getTasks(date) {
    const response = await request.get("/tasks", { params: { date } });
    return response.data;
  },

  // 创建任务
  async createTask(taskData) {
    const response = await request.post("/tasks", taskData);
    return response.data;
  },

  // 更新任务
  async updateTask(taskId, updates) {
    const response = await request.patch(`/tasks/${taskId}`, updates);
    return response.data;
  },

  // 删除任务
  async deleteTask(taskId) {
    const response = await request.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // 获取月度任务概览（日历视图）
  async getCalendarData(month) {
    const response = await request.get("/tasks/calendar", {
      params: { month },
    });
    return response.data;
  },

  // 获取统计数据（支持日期范围）
  async getStats(startDate, endDate) {
    const response = await request.get("/tasks/stats", {
      params: { start: startDate, end: endDate },
    });
    return response.data;
  },

  // 获取连续完成天数
  async getStreak() {
    const response = await request.get("/tasks/streak");
    return response.data;
  },

  // 获取连续完成天数（别名方法）
  async getStreakDays() {
    return this.getStreak();
  },

  // 批量更新任务
  async batchUpdate(updates) {
    const response = await request.patch("/tasks/batch", { updates });
    return response.data;
  },
};
