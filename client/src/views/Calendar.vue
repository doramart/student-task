<template>
  <div class="calendar-view">
    <!-- 导航栏 -->
    <van-nav-bar title="任务日历" />

    <!-- 月份选择 -->
    <div class="month-selector">
      <van-button size="small" @click="changeMonth(-1)" :disabled="loading">
        <van-icon name="arrow-left" />
        上月
      </van-button>

      <div class="month-info">
        <span class="current-month">{{ currentMonthText }}</span>
        <van-button
          size="mini"
          type="primary"
          plain
          @click="goToToday"
          :disabled="loading || isCurrentMonth"
          class="today-btn"
        >
          今天
        </van-button>
      </div>

      <van-button
        size="small"
        @click="changeMonth(1)"
        :disabled="loading || isCurrentMonth"
      >
        下月
        <van-icon name="arrow" />
      </van-button>
    </div>

    <!-- 日历组件 -->
    <div class="calendar-container">
      <van-calendar
        v-model="showCalendar"
        :default-date="defaultDate"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="dayFormatter"
        @select="onDateSelect"
        :show-confirm="false"
        :readonly="false"
      />
    </div>

    <!-- 统计信息 -->
    <div class="month-stats" v-if="monthStats">
      <van-card>
        <template #title>
          <span>{{ currentMonthText }}统计</span>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ monthStats.totalDays }}</div>
            <div class="stat-label">有任务天数</div>
          </div>

          <div class="stat-item">
            <div class="stat-value">{{ monthStats.completedDays }}</div>
            <div class="stat-label">完成天数</div>
          </div>

          <div class="stat-item">
            <div class="stat-value">{{ monthStats.completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </van-card>
    </div>

    <!-- 日期详情弹窗 -->
    <van-popup
      v-model="showDateDetail"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="date-detail">
        <div class="detail-header">
          <h3>{{ selectedDateText }}</h3>
          <van-button plain @click="showDateDetail = false">关闭</van-button>
        </div>

        <div class="detail-content">
          <div v-if="selectedDateTasks.length === 0" class="no-tasks">
            该日期没有任务记录
          </div>

          <div v-else>
            <div class="date-stats">
              <span>总任务: {{ selectedDateTasks.length }}</span>
              <span>已完成: {{ completedTasksCount }}</span>
              <span>完成率: {{ selectedDateCompletionRate }}%</span>
            </div>

            <div class="tasks-list">
              <div
                v-for="task in selectedDateTasks"
                :key="task._id"
                class="task-item"
                :class="{ completed: task.isCompleted }"
              >
                <van-icon
                  :name="task.isCompleted ? 'checked' : 'circle'"
                  :color="task.isCompleted ? '#1989fa' : '#c8c9cc'"
                />
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-meta">
                    <van-tag
                      :color="getSubjectColor(task.subject)"
                      size="mini"
                      plain
                    >
                      {{ task.subject }}
                    </van-tag>
                    <span v-if="task.completedAt" class="completed-time">
                      {{ formatTime(task.completedAt) }}完成
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 加载状态 -->
    <van-loading
      v-if="loading"
      class="loading-overlay"
      type="spinner"
      size="24px"
    >
      加载中...
    </van-loading>
  </div>
</template>

<script>
import { mapState } from "vuex";
import dayjs from "dayjs";
import taskApi from "@/api/task";
import { getSubjectColor } from "@/config/subjects";

export default {
  name: "CalendarView",

  data() {
    return {
      showCalendar: true,
      showDateDetail: false,
      loading: false,
      currentMonth: dayjs().format("YYYY-MM"),
      calendarData: [],
      selectedDate: null,
      selectedDateTasks: [],
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(),
      // 添加今天的日期作为默认选中日期
      defaultDate: new Date(),
    };
  },

  computed: {
    ...mapState(["subjects"]),

    calendarDate() {
      return new Date(this.currentMonth + "-01");
    },

    currentMonthText() {
      return dayjs(this.currentMonth).format("YYYY年MM月");
    },

    isCurrentMonth() {
      return this.currentMonth === dayjs().format("YYYY-MM");
    },

    selectedDateText() {
      if (!this.selectedDate) return "";
      return dayjs(this.selectedDate).format("YYYY年MM月DD日");
    },

    completedTasksCount() {
      return this.selectedDateTasks.filter((task) => task.isCompleted).length;
    },

    selectedDateCompletionRate() {
      if (this.selectedDateTasks.length === 0) return 0;
      return Math.round(
        (this.completedTasksCount / this.selectedDateTasks.length) * 100
      );
    },

    monthStats() {
      if (this.calendarData.length === 0) return null;

      const totalDays = this.calendarData.length;
      const completedDays = this.calendarData.filter(
        (day) => day.status === "completed"
      ).length;
      const completionRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return {
        totalDays,
        completedDays,
        completionRate,
      };
    },
  },

  async created() {
    await this.loadCalendarData();

    // 自动选中今天并加载今天的任务
    const today = dayjs().format("YYYY-MM-DD");
    await this.loadTodayTasks(today);
  },

  methods: {
    async loadCalendarData() {
      try {
        this.loading = true;
        this.calendarData = await taskApi.getCalendarData(this.currentMonth);
      } catch (error) {
        console.error("加载日历数据失败:", error);
        this.$toast.fail("加载日历数据失败: " + error.message);
        // 出错时设置为空数组
        this.calendarData = [];
      } finally {
        // 确保无论成功还是失败都重置loading状态
        this.loading = false;
      }
    },

    async changeMonth(offset) {
      const newMonth = dayjs(this.currentMonth).add(offset, "month");

      // 不能查看未来月份
      if (newMonth.isAfter(dayjs(), "month")) {
        this.$toast("不能查看未来月份");
        return;
      }

      this.currentMonth = newMonth.format("YYYY-MM");
      try {
        await this.loadCalendarData();
      } catch (error) {
        // 捕获并处理可能的异步错误
        console.error("切换月份时加载数据失败:", error);
      }
    },

    dayFormatter(day) {
      const dateStr = dayjs(day.date).format("YYYY-MM-DD");
      const today = dayjs().format("YYYY-MM-DD");
      const dayData = this.calendarData.find((item) => item.date === dateStr);

      let className = "";
      let bottomInfo = "";

      // 检查是否是今天
      if (dateStr === today) {
        className += " today";
      }

      if (dayData) {
        className += " has-tasks";

        switch (dayData.status) {
          case "completed":
            className += " completed";
            bottomInfo = "✅";
            break;
          case "partial":
            className += " partial";
            bottomInfo = "📝";
            break;
          case "pending":
            className += " pending";
            bottomInfo = "⏳";
            break;
        }
      }

      return {
        ...day,
        className,
        bottomInfo,
      };
    },

    async onDateSelect(date) {
      const selectedDateStr = dayjs(date).format("YYYY-MM-DD");
      await this.loadTodayTasks(selectedDateStr);
      this.showDateDetail = true;
    },

    async loadTodayTasks(dateStr) {
      try {
        this.loading = true;
        this.selectedDate = dateStr;
        this.selectedDateTasks = await taskApi.getTasks(dateStr);
      } catch (error) {
        console.error("加载任务详情失败:", error);
        this.$toast.fail("加载任务详情失败: " + error.message);
        // 出错时设置为空数组
        this.selectedDateTasks = [];
      } finally {
        // 确保无论成功还是失败都重置loading状态
        this.loading = false;
      }
    },

    getSubjectColor,

    formatTime(time) {
      return dayjs(time).format("HH:mm");
    },

    async goToToday() {
      const today = dayjs();
      const todayMonth = today.format("YYYY-MM");
      const todayDate = today.format("YYYY-MM-DD");

      try {
        // 如果今天不在当前显示的月份，先切换到今天所在的月份
        if (this.currentMonth !== todayMonth) {
          this.currentMonth = todayMonth;
          await this.loadCalendarData();
        }

        // 选中今天并加载任务
        await this.loadTodayTasks(todayDate);
        this.showDateDetail = true;
      } catch (error) {
        // 捕获并处理可能的异步错误
        console.error("跳转到今天时失败:", error);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.calendar-view {
  height: 100vh;
  background-color: @background-dark;

  .month-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: @spacing-md;
    background: @card-background;
    box-shadow: @card-shadow;

    .month-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: @spacing-xs;

      .current-month {
        font-size: @font-size-lg;
        font-weight: @font-weight-semibold;
        color: @text-color;
      }

      .today-btn {
        border-radius: @border-radius-lg;
      }
    }
  }

  .calendar-container {
    flex: 1;
    overflow: hidden;
  }

  /* 日历样式定制 */
  :deep(.van-calendar__day) {
    position: relative;
    transition: all @animation-duration-base @animation-timing-function;
    border-radius: @border-radius-lg;

    /* 今天的日期样式 */
    &.today {
      background: @card-gradient-bg;
      color: @text-color-inverse;
      font-weight: @font-weight-semibold;
      border-radius: @border-radius-lg;
      box-shadow: @shadow-button;

      /* 今天有任务时的样式 */
      &.has-tasks {
        background: @card-gradient-bg;
        color: @text-color-inverse;
        box-shadow: @shadow-button;
      }

      /* 今天并且完成任务的样式 */
      &.completed {
        background: linear-gradient(
          135deg,
          @success-color 0%,
          darken(@success-color, 20%) 100%
        );
        color: @text-color-inverse;
        box-shadow: 0 2px 8px fade(@success-color, 40%);
      }

      /* 今天并且部分完成任务的样式 */
      &.partial {
        background: linear-gradient(
          135deg,
          @warning-color 0%,
          darken(@warning-color, 20%) 100%
        );
        color: @text-color-inverse;
        box-shadow: 0 2px 8px fade(@warning-color, 40%);
      }

      /* 今天并且有未完成任务的样式 */
      &.pending {
        background: linear-gradient(
          135deg,
          @error-color 0%,
          darken(@error-color, 10%) 100%
        );
        color: @text-color-inverse;
        box-shadow: 0 2px 8px fade(@error-color, 40%);
      }
    }

    &.has-tasks {
      background-color: lighten(@primary-color, 40%);
      border: 1px solid lighten(@primary-color, 30%);
    }

    &.completed {
      background: linear-gradient(
        135deg,
        @success-color 0%,
        darken(@success-color, 20%) 100%
      );
      color: @text-color-inverse;
      border-radius: @border-radius-lg;
      box-shadow: 0 2px 4px fade(@success-color, 20%);
    }

    &.partial {
      background: linear-gradient(
        135deg,
        @warning-color 0%,
        darken(@warning-color, 20%) 100%
      );
      color: @text-color-inverse;
      border-radius: @border-radius-lg;
      box-shadow: 0 2px 4px fade(@warning-color, 20%);
    }

    &.pending {
      background: linear-gradient(
        135deg,
        @error-color 0%,
        darken(@error-color, 10%) 100%
      );
      color: @text-color-inverse;
      border-radius: @border-radius-lg;
      box-shadow: 0 2px 4px fade(@error-color, 20%);
    }

    /* 悬停效果 */
    &:hover {
      transform: translateY(-1px);
    }
  }

  :deep(.van-calendar__bottom-info) {
    font-size: @font-size-sm;
    line-height: 1;
  }
}

.month-stats {
  padding: @spacing-md;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: @spacing-md;
    padding: @spacing-md 0;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: @font-size-h1;
        font-weight: @font-weight-semibold;
        color: @primary-color;
        margin-bottom: @spacing-xs;
      }

      .stat-label {
        font-size: @font-size-sm;
        color: @text-color-secondary;
      }
    }
  }
}

/* 日期详情弹窗 */
.date-detail {
  height: 100%;
  display: flex;
  flex-direction: column;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: @spacing-md;
    border-bottom: 1px solid @border-color-light;

    h3 {
      margin: 0;
      font-size: @font-size-h3;
      font-weight: @font-weight-semibold;
    }
  }

  .detail-content {
    flex: 1;
    padding: @spacing-md;
    overflow-y: auto;

    .no-tasks {
      text-align: center;
      color: @text-color-secondary;
      padding: @spacing-xl 0;
    }

    .date-stats {
      display: flex;
      justify-content: space-around;
      padding: @spacing-sm;
      background: @background-dark;
      border-radius: @border-radius-lg;
      margin-bottom: @spacing-md;
      font-size: @font-size-base;
      color: @text-color-secondary;
    }

    .tasks-list {
      .task-item {
        display: flex;
        align-items: flex-start;
        padding: @spacing-sm;
        background: @card-background;
        border-radius: @border-radius-lg;
        margin-bottom: @spacing-xs;

        &.completed {
          opacity: 0.7;

          .task-title {
            text-decoration: line-through;
            color: @text-color-secondary;
          }
        }

        .van-icon {
          margin-right: @spacing-sm;
          margin-top: 2px;
          font-size: @font-size-h3;
        }

        .task-content {
          flex: 1;

          .task-title {
            font-size: @font-size-base;
            font-weight: @font-weight-medium;
            color: @text-color;
            margin-bottom: @spacing-xs;
          }

          .task-meta {
            display: flex;
            align-items: center;
            gap: @spacing-xs;

            .completed-time {
              font-size: @font-size-sm;
              color: @accent-green;
            }
          }
        }
      }
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: @z-index-modal;
}

/* 响应式设计 */
@media (max-width: @screen-sm) {
  .calendar-view {
    .month-selector {
      padding: @spacing-sm;

      .month-info {
        .current-month {
          font-size: @font-size-base;
        }
      }
    }
  }

  .month-stats {
    padding: @spacing-sm;

    .stats-grid {
      gap: @spacing-sm;

      .stat-item {
        .stat-value {
          font-size: @font-size-lg;
        }
      }
    }
  }

  .date-detail {
    .detail-header {
      padding: @spacing-sm;

      h3 {
        font-size: @font-size-lg;
      }
    }

    .detail-content {
      padding: @spacing-sm;
    }
  }
}
</style>
