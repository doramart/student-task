import Vue from "vue";
import Vuex from "vuex";
import dayjs from "dayjs";
import taskApi from "@/api/task";
import authApi from "@/api/auth";
import { SUBJECTS } from "@/config/subjects";

Vue.use(Vuex);

// 本地存储键名
const STORAGE_KEYS = {
  TASKS_CACHE: "student_tasks_cache",
  CURRENT_DATE: "student_current_date",
  USER_INFO: "user_info",
  AUTH_TOKEN: "student_tasks_auth_token",
};

export default new Vuex.Store({
  state: {
    // 当前查看的日期
    currentDate: dayjs().format("YYYY-MM-DD"),
    // 任务数据缓存 { date: tasks[] }
    tasksCache: {},
    // 加载状态
    loading: false,
    // 应用初始化状态
    appInitialized: false,
    // 历史统计数据
    stats: {
      weeklyStats: [],
      monthlyStats: [],
      streak: 0,
    },
    // 科目列表
    subjects: SUBJECTS,
    // 用户相关状态
    user: null,
    isLoggedIn: false,
    token: null,
  },

  getters: {
    // 当前日期的任务
    currentTasks: (state) => state.tasksCache[state.currentDate] || [],

    // 是否为今日
    isToday: (state) => state.currentDate === dayjs().format("YYYY-MM-DD"),

    // 当前日期任务完成统计
    currentTasksStats: (state, getters) => {
      const tasks = getters.currentTasks;
      const total = tasks.length;
      const completed = tasks.filter((task) => task.isCompleted).length;

      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },

    // 按科目分组的任务
    tasksBySubject: (state, getters) => {
      const tasks = getters.currentTasks;
      const grouped = {};

      state.subjects.forEach((subject) => {
        grouped[subject] = tasks.filter((task) => task.subject === subject);
      });

      return grouped;
    },

    // 各科目完成统计
    subjectStats: (state, getters) => {
      const tasksBySubject = getters.tasksBySubject;
      const stats = {};

      Object.keys(tasksBySubject).forEach((subject) => {
        const tasks = tasksBySubject[subject];
        const total = tasks.length;
        const completed = tasks.filter((task) => task.isCompleted).length;

        // 只返回有任务的科目
        if (total > 0) {
          stats[subject] = {
            total,
            completed,
            percentage: Math.round((completed / total) * 100),
          };
        }
      });

      return stats;
    },

    // 用户相关getters
    currentUser: (state) => state.user,
    userEmail: (state) => state.user?.email || "",
    userName: (state) => state.user?.nickname || state.user?.username || "",
    userAvatar: (state) => state.user?.avatar || "",
  },

  mutations: {
    // 设置当前日期
    SET_CURRENT_DATE(state, date) {
      state.currentDate = date;
      localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, date);
    },

    // 设置任务缓存
    SET_TASKS_CACHE(state, { date, tasks }) {
      Vue.set(state.tasksCache, date, tasks);
      this.dispatch("saveTasksCache");
    },

    // 设置加载状态
    SET_LOADING(state, loading) {
      state.loading = loading;
    },

    // 设置应用初始化状态
    SET_APP_INITIALIZED(state, initialized) {
      state.appInitialized = initialized;
    },

    // 更新任务状态
    UPDATE_TASK(state, { date, taskId, updates }) {
      const tasks = state.tasksCache[date];
      if (tasks) {
        const taskIndex = tasks.findIndex((task) => task._id === taskId);
        if (taskIndex !== -1) {
          Object.assign(tasks[taskIndex], updates);
          this.dispatch("saveTasksCache");
        }
      }
    },

    // 添加任务
    ADD_TASK(state, { date, task }) {
      if (!state.tasksCache[date]) {
        Vue.set(state.tasksCache, date, []);
      }
      state.tasksCache[date].push(task);
      this.dispatch("saveTasksCache");
    },

    // 删除任务
    REMOVE_TASK(state, { date, taskId }) {
      const tasks = state.tasksCache[date];
      if (tasks) {
        const taskIndex = tasks.findIndex((task) => task._id === taskId);
        if (taskIndex !== -1) {
          tasks.splice(taskIndex, 1);
          this.dispatch("saveTasksCache");
        }
      }
    },

    // 设置统计数据
    SET_STATS(state, stats) {
      state.stats = { ...state.stats, ...stats };
    },

    // 设置连续完成天数
    SET_STREAK_DAYS(state, streakDays) {
      state.stats.streak = streakDays;
    },

    // 初始化本地缓存
    INIT_CACHE(state) {
      try {
        const cachedTasks = localStorage.getItem(STORAGE_KEYS.TASKS_CACHE);
        const cachedDate = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
        const cachedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        const cachedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (cachedTasks) {
          state.tasksCache = JSON.parse(cachedTasks);
        }

        if (cachedDate) {
          state.currentDate = cachedDate;
        }

        if (cachedUser) {
          state.user = JSON.parse(cachedUser);
        }

        if (cachedToken) {
          state.token = cachedToken;
        }

        // 如果有用户信息或者有token，都认为是已登录状态
        // 具体的有效性会在后续的checkAuth中验证
        if (cachedUser || cachedToken) {
          state.isLoggedIn = true;
        }
      } catch (error) {
        console.error("Failed to load cache:", error);
      }
    },

    // 用户相关mutations
    SET_USER(state, user) {
      state.user = user;
      state.isLoggedIn = !!user;
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    },

    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    },

    CLEAR_AUTH(state) {
      // 清除用户相关状态
      state.user = null;
      state.isLoggedIn = false;
      state.token = null;

      // 清除任务相关数据
      state.tasksCache = {};
      state.currentDate = dayjs().format("YYYY-MM-DD");

      // 清除统计数据
      state.stats = {
        weeklyStats: [],
        monthlyStats: [],
        streak: 0,
      };

      // 重置加载状态
      state.loading = false;

      // 清除所有本地存储
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DATE);

      console.log("🧹 已清除所有用户相关的本地缓存");
    },
  },

  actions: {
    // 初始化应用
    async initApp({ commit, dispatch }) {
      try {
        commit("INIT_CACHE");
        // 检查用户登录状态
        if (this.state.isLoggedIn) {
          try {
            await dispatch("checkAuth");
            // 只有在用户已登录且认证通过的情况下才加载任务
            await dispatch("loadTasks");
          } catch (error) {
            console.error("用户状态检查失败:", error);
            commit("CLEAR_AUTH");
          }
        }
        // 如果用户未登录，不加载任务数据
      } catch (error) {
        console.error("应用初始化失败:", error);
      } finally {
        // 无论成功或失败，都标记初始化完成
        commit("SET_LOADING", false);
        commit("SET_APP_INITIALIZED", true);
      }
    },

    // 切换日期
    async changeDate({ commit, dispatch }, date) {
      commit("SET_CURRENT_DATE", date);
      await dispatch("loadTasks");
    },

    // 加载任务数据
    async loadTasks({ commit, state }) {
      // 添加调用栈跟踪，帮助定位是谁调用了这个方法

      const date = state.currentDate;
      // 检查缓存 - 只有当缓存存在且不为空数组时才使用缓存
      if (state.tasksCache[date] && state.tasksCache[date].length > 0) {
        console.log("📋 使用缓存数据:", date, state.tasksCache[date]);
        return state.tasksCache[date];
      }

      try {
        commit("SET_LOADING", true);
        console.log("🌐 从服务器加载数据:", date);
        const tasks = await taskApi.getTasks(date);
        commit("SET_TASKS_CACHE", { date, tasks });
        console.log("✅ 数据加载完成:", date, tasks);
        return tasks;
      } catch (error) {
        console.error("Failed to load tasks:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // 创建任务
    async createTask({ commit, dispatch }, taskData) {
      try {
        const task = await taskApi.createTask(taskData);
        commit("ADD_TASK", { date: taskData.date, task });
        return task;
      } catch (error) {
        console.error("Failed to create task:", error);
        throw error;
      }
    },

    // 更新任务
    async updateTask({ commit, state }, { taskId, updates }) {
      try {
        const updatedTask = await taskApi.updateTask(taskId, updates);
        // 使用当前日期而不是API返回的日期，确保格式一致
        const taskDate = dayjs(updatedTask.date).format("YYYY-MM-DD");
        commit("UPDATE_TASK", {
          date: taskDate,
          taskId,
          updates: updatedTask,
        });
        return updatedTask;
      } catch (error) {
        console.error("Failed to update task:", error);
        throw error;
      }
    },

    // 删除任务
    async deleteTask({ commit }, { taskId, date }) {
      try {
        await taskApi.deleteTask(taskId);
        commit("REMOVE_TASK", { date, taskId });
      } catch (error) {
        console.error("Failed to delete task:", error);
        throw error;
      }
    },

    // 保存任务缓存到本地存储
    saveTasksCache({ state }) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.TASKS_CACHE,
          JSON.stringify(state.tasksCache)
        );
      } catch (error) {
        console.error("Failed to save tasks cache:", error);
      }
    },

    // 加载统计数据
    async loadStats({ commit }, { startDate, endDate }) {
      try {
        const stats = await taskApi.getStats(startDate, endDate);
        commit("SET_STATS", stats);
        return stats;
      } catch (error) {
        console.error("Failed to load stats:", error);
        throw error;
      }
    },

    // 获取任务统计数据
    async fetchTaskStats({ commit }, { month }) {
      try {
        const response = await taskApi.getStats(month);
        commit("SET_TASK_STATS", response.data);
        return response.data;
      } catch (error) {
        console.error("获取统计数据失败:", error);
        throw error;
      }
    },

    // 清理过期任务（可选功能）
    // eslint-disable-next-line no-unused-vars
    async cleanupExpiredTasks({ commit, dispatch }) {
      try {
        // 这里可以实现清理逻辑
        // const response = await taskApi.cleanup()
        // return response.data
      } catch (error) {
        console.error("清理过期任务失败:", error);
        throw error;
      }
    },

    // 连续完成天数（连击）
    async fetchStreakDays({ commit }) {
      try {
        const response = await taskApi.getStreakDays();
        commit("SET_STREAK_DAYS", response.data.streakDays);
        return response.data.streakDays;
      } catch (error) {
        console.error("获取连击数据失败:", error);
        return 0;
      }
    },

    // 批量更新任务
    // eslint-disable-next-line no-unused-vars
    async batchUpdateTasks({ commit }, { updates }) {
      try {
        const response = await taskApi.batchUpdate(updates);
        if (response.success) {
          // 如果批量更新成功，重新获取当日任务
          // 可以在外部调用 fetchTasksByDate
          return response.data;
        }
      } catch (error) {
        console.error("批量更新任务失败:", error);
        throw error;
      }
    },

    // 用户相关actions
    // 发送验证码
    async sendVerifyCode({ commit }, email) {
      try {
        const response = await authApi.sendVerifyCode(email);
        return response.data;
      } catch (error) {
        console.error("发送验证码失败:", error);
        throw error;
      }
    },

    // 登录
    async login({ commit }, { email, code }) {
      try {
        const response = await authApi.login(email, code);
        const { token, user } = response.data;

        commit("SET_TOKEN", token);
        commit("SET_USER", user);

        return response.data;
      } catch (error) {
        console.error("登录失败:", error);
        throw error;
      }
    },

    // 退出登录
    async logout({ commit }) {
      try {
        await authApi.logout();
        commit("CLEAR_AUTH");
        return true;
      } catch (error) {
        console.error("退出登录失败:", error);
        // 即使API调用失败，也清除本地状态
        commit("CLEAR_AUTH");
        throw error;
      }
    },

    // 检查用户登录状态
    async checkAuth({ commit, state }) {
      try {
        if (!state.isLoggedIn) {
          throw new Error("用户未登录");
        }

        const response = await authApi.getProfile();
        commit("SET_USER", response.data);
        return response.data;
      } catch (error) {
        console.error("检查用户状态失败:", error);
        commit("CLEAR_AUTH");
        throw error;
      }
    },

    // 获取用户信息
    async getUserProfile({ commit }) {
      try {
        const response = await authApi.getProfile();
        commit("SET_USER", response.data);
        return response.data;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        throw error;
      }
    },
  },
});
