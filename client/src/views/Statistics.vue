<template>
  <div class="statistics-view">
    <!-- 导航栏 -->
    <van-nav-bar title="学习统计" />

    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <van-tabs v-model="activeTimeRange" @click="onTimeRangeChange">
        <van-tab title="最近7天" name="week"></van-tab>
        <van-tab title="最近30天" name="month"></van-tab>
        <van-tab title="自定义" name="custom"></van-tab>
      </van-tabs>
    </div>

    <!-- 自定义时间范围 -->
    <div v-if="activeTimeRange === 'custom'" class="custom-range">
      <van-cell-group>
        <van-field
          v-model="customRange.start"
          label="开始日期"
          placeholder="选择开始日期"
          readonly
          @click="showStartPicker = true"
        />
        <van-field
          v-model="customRange.end"
          label="结束日期"
          placeholder="选择结束日期"
          readonly
          @click="showEndPicker = true"
        />
      </van-cell-group>

      <div class="range-actions">
        <van-button type="primary" @click="loadCustomStats" :loading="loading">
          查看统计
        </van-button>
      </div>
    </div>

    <!-- 总体统计卡片 -->
    <div class="overview-stats">
      <div class="stats-card">
        <h3 class="card-title">总体完成情况</h3>

        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-value">{{ overviewStats.totalTasks }}</div>
            <div class="overview-label">总任务数</div>
          </div>

          <div class="overview-item">
            <div class="overview-value">{{ overviewStats.completedTasks }}</div>
            <div class="overview-label">已完成</div>
          </div>

          <div class="overview-item">
            <div class="overview-value">
              {{ overviewStats.completionRate }}%
            </div>
            <div class="overview-label">完成率</div>
          </div>

          <div class="overview-item">
            <div class="overview-value">{{ streakDays }}</div>
            <div class="overview-label">连续完成</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 科目完成率统计 -->
    <div class="subject-stats">
      <div class="stats-card">
        <h3 class="card-title">各科目完成率</h3>

        <div class="subject-list">
          <div v-for="subject in subjects" :key="subject" class="subject-item">
            <div class="subject-header">
              <span class="subject-name">{{ subject }}</span>
              <span class="subject-percentage">
                {{ getSubjectStats(subject).percentage }}%
              </span>
            </div>

            <van-progress
              :percentage="getSubjectStats(subject).percentage"
              :color="getSubjectColor(subject)"
              stroke-width="8px"
              show-pivot
              :pivot-text="`${getSubjectStats(subject).completed}/${
                getSubjectStats(subject).total
              }`"
              :pivot-color="getSubjectColor(subject)"
            />

            <div class="subject-detail">
              <span>完成 {{ getSubjectStats(subject).completed }}</span>
              <span>总计 {{ getSubjectStats(subject).total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日完成率趋势 -->
    <div class="daily-trend">
      <div class="stats-card">
        <h3 class="card-title">每日完成率趋势</h3>

        <div class="trend-chart">
          <div v-if="dailyStats.length === 0" class="no-data">暂无数据</div>

          <div v-else class="chart-container">
            <!-- 简单的柱状图 -->
            <div class="chart-grid">
              <div
                v-for="(day, index) in dailyStats"
                :key="index"
                class="chart-bar"
                :style="{ height: day.completionRate + '%' }"
                :title="`${day.date}: ${day.completionRate}%`"
              >
                <div class="bar-value">{{ day.completionRate }}%</div>
              </div>
            </div>

            <div class="chart-labels">
              <div
                v-for="(day, index) in dailyStats"
                :key="index"
                class="chart-label"
              >
                {{ formatDateLabel(day.date) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习习惯分析 -->
    <div class="habit-analysis">
      <div class="stats-card">
        <h3 class="card-title">学习习惯分析</h3>

        <div class="habit-items">
          <div class="habit-item">
            <van-icon name="clock-o" />
            <div class="habit-content">
              <div class="habit-title">最活跃时间段</div>
              <div class="habit-value">{{ mostActiveTime }}</div>
            </div>
          </div>

          <div class="habit-item">
            <van-icon name="award-o" />
            <div class="habit-content">
              <div class="habit-title">最擅长科目</div>
              <div class="habit-value">{{ bestSubject }}</div>
            </div>
          </div>

          <div class="habit-item">
            <van-icon name="fire-o" />
            <div class="habit-content">
              <div class="habit-title">历史最长连续</div>
              <div class="habit-value">{{ maxStreak }}天</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model="showStartPicker" position="bottom">
      <van-datetime-picker
        v-model="startPickerDate"
        type="date"
        title="选择开始日期"
        @confirm="onStartDateConfirm"
        @cancel="showStartPicker = false"
      />
    </van-popup>

    <van-popup v-model="showEndPicker" position="bottom">
      <van-datetime-picker
        v-model="endPickerDate"
        type="date"
        title="选择结束日期"
        @confirm="onEndDateConfirm"
        @cancel="showEndPicker = false"
      />
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
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import taskApi from "@/api/task";
import { getSubjectColor } from "@/config/subjects";

// 启用 dayjs 插件
dayjs.extend(isSameOrBefore);

export default {
  name: "StatisticsView",

  data() {
    return {
      loading: false,
      activeTimeRange: "week",
      showStartPicker: false,
      showEndPicker: false,
      startPickerDate: new Date(),
      endPickerDate: new Date(),
      customRange: {
        start: "",
        end: "",
      },
      dailyStats: [],
      streakDays: 0,
      maxStreak: 0,
      mostActiveTime: "暂无数据",
      bestSubject: "暂无数据",
    };
  },

  computed: {
    ...mapState(["subjects"]),

    overviewStats() {
      // 确保dailyStats是数组且不为空
      if (!Array.isArray(this.dailyStats) || this.dailyStats.length === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
        };
      }

      const totalTasks = this.dailyStats.reduce(
        (sum, day) => sum + (day.totalTasks || 0),
        0
      );
      const completedTasks = this.dailyStats.reduce(
        (sum, day) => sum + (day.completedTasks || 0),
        0
      );
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        completionRate,
      };
    },
  },

  async created() {
    // 先加载连续天数，再加载统计数据，确保analyzeHabits时有正确的streakDays
    await this.loadStreak();
    await this.loadStats();
  },

  methods: {
    async loadStats() {
      try {
        this.loading = true;

        let startDate, endDate;

        switch (this.activeTimeRange) {
          case "week":
            startDate = dayjs().subtract(6, "day").format("YYYY-MM-DD");
            endDate = dayjs().format("YYYY-MM-DD");
            break;
          case "month":
            startDate = dayjs().subtract(29, "day").format("YYYY-MM-DD");
            endDate = dayjs().format("YYYY-MM-DD");
            break;
          case "custom":
            startDate = this.customRange.start;
            endDate = this.customRange.end;
            break;
        }

        if (!startDate || !endDate) {
          this.loading = false; // 确保在早期返回时也重置loading状态
          return;
        }

        const statsData = await taskApi.getStats(startDate, endDate);

        // 转换API数据格式为组件期望的格式
        this.dailyStats = this.transformStatsData(
          statsData,
          startDate,
          endDate
        );

        // 分析学习习惯
        this.analyzeHabits();

        // 强制更新组件，确保界面显示最新数据
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      } catch (error) {
        console.error("加载统计数据失败:", error);
        this.$toast.fail("加载统计数据失败: " + error.message);
        // 出错时设置为空数组避免reduce错误
        this.dailyStats = [];
      } finally {
        // 确保无论成功还是失败都重置loading状态
        this.loading = false;
      }
    },

    // 转换API统计数据为组件所需格式
    transformStatsData(apiData, startDate, endDate) {
      // API返回的是期间总计，直接使用总计数据而不是模拟每日数据
      const days = [];
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const totalDays = end.diff(start, "day") + 1;

      // 为了兼容现有的日期选择逻辑，我们创建一个单日数据包含所有统计
      // 但使用总计数据而不是平均值
      const dayData = {
        date: start.format("YYYY-MM-DD"), // 使用起始日期
        totalTasks: apiData.total || 0,
        completedTasks: apiData.completed || 0,
        completionRate:
          apiData.total > 0
            ? Math.round((apiData.completed / apiData.total) * 100)
            : 0,
        subjects: this.subjects.map((subject) => {
          return {
            subject,
            // 直接使用总计数据，不除以天数
            total: apiData.subjects[subject]?.total || 0,
            completed: apiData.subjects[subject]?.completed || 0,
          };
        }),
      };

      days.push(dayData);
      return days;
    },

    async loadCustomStats() {
      if (!this.customRange.start || !this.customRange.end) {
        this.$toast.fail("请选择时间范围");
        return;
      }

      if (dayjs(this.customRange.start).isAfter(dayjs(this.customRange.end))) {
        this.$toast.fail("开始日期不能晚于结束日期");
        return;
      }

      await this.loadStats();
    },

    async loadStreak() {
      try {
        const result = await taskApi.getStreak();
        this.streakDays = result.streak;
        // 连续天数更新后，重新分析习惯数据以更新maxStreak
        this.analyzeHabits();
      } catch (error) {
        console.error("加载连续天数失败:", error);
        // 即使连续天数加载失败，也不应该影响页面显示
        this.streakDays = 0;
        // 失败时也要重新分析，确保使用默认值
        this.analyzeHabits();
      }
    },

    async onTimeRangeChange() {
      if (this.activeTimeRange !== "custom") {
        try {
          // 切换时间范围时重新加载数据，先加载连续天数再加载统计
          await this.loadStreak();
          await this.loadStats();
        } catch (error) {
          // 捕获并处理可能的异步错误
          console.error("切换时间范围时加载数据失败:", error);
        }
      }
    },

    onStartDateConfirm(value) {
      this.customRange.start = dayjs(value).format("YYYY-MM-DD");
      this.showStartPicker = false;
    },

    onEndDateConfirm(value) {
      this.customRange.end = dayjs(value).format("YYYY-MM-DD");
      this.showEndPicker = false;
    },

    getSubjectStats(subject) {
      // 确保dailyStats是数组
      if (!Array.isArray(this.dailyStats)) {
        return { total: 0, completed: 0, percentage: 0 };
      }

      let total = 0;
      let completed = 0;

      this.dailyStats.forEach((day) => {
        if (day.subjects && Array.isArray(day.subjects)) {
          const subjectData = day.subjects.find((s) => s.subject === subject);
          if (subjectData) {
            total += subjectData.total || 0;
            completed += subjectData.completed || 0;
          }
        }
      });

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, percentage };
    },

    getSubjectColor,

    formatDateLabel(date) {
      return dayjs(date).format("MM-DD");
    },

    analyzeHabits() {
      if (this.dailyStats.length === 0) return;

      // 分析最擅长科目
      let bestSubjectData = { subject: "", rate: 0 };

      this.subjects.forEach((subject) => {
        const stats = this.getSubjectStats(subject);
        if (stats.percentage > bestSubjectData.rate) {
          bestSubjectData = { subject, rate: stats.percentage };
        }
      });

      this.bestSubject = bestSubjectData.subject || "暂无数据";

      // 计算历史最长连续 - 确保使用正确的streakDays值
      // 如果streakDays还没有被正确设置（比如异步加载未完成），等待下次更新
      this.maxStreak = Math.max(this.streakDays || 0, 0);

      // 最活跃时间段分析（这里是模拟数据，实际需要根据完成时间分析）
      this.mostActiveTime = "18:00-20:00";
    },
  },
};
</script>

<style lang="less" scoped>
.statistics-view {
  min-height: calc(100vh - 50px);
  background-color: @background-dark;
  padding-bottom: 50px;
  font-family: @font-family-base;

  .time-range-selector {
    background: @card-background;
    margin-bottom: @spacing-xs;
    box-shadow: @card-shadow;

    :deep(.van-tab) {
      font-weight: @font-weight-medium;
      font-size: @font-size-base;
    }

    :deep(.van-tabs__line) {
      background: @primary-color;
      border-radius: @border-radius-sm;
    }
  }

  .custom-range {
    background: @card-background;
    padding: @spacing-md;
    margin-bottom: @spacing-xs;
    border-radius: @border-radius-lg;
    box-shadow: @card-shadow;

    .range-actions {
      padding: @spacing-md 0;
      text-align: center;
    }
  }

  .stats-card {
    background: @card-background;
    border-radius: @border-radius-lg;
    box-shadow: @card-shadow;
    padding: @spacing-md;
    transition: all @animation-duration-base @animation-timing-function;

    &:hover {
      box-shadow: @shadow-float;
      transform: translateY(-2px);
    }

    .card-title {
      font-size: @font-size-h3;
      font-weight: @font-weight-semibold;
      color: @text-color;
      margin-bottom: @spacing-md;
      letter-spacing: -0.3px;
    }
  }
}

/* 现代化统计卡片区域 */
.overview-stats,
.subject-stats,
.daily-trend,
.habit-analysis {
  margin: 0 @spacing-sm @spacing-sm;

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: @spacing-md;
    padding: @spacing-md 0;

    .overview-item {
      text-align: center;
      padding: @spacing-sm;
      background: @background-dark;
      border-radius: @border-radius-sm;
      transition: all @animation-duration-base @animation-timing-function;

      &:hover {
        background: @primary-color;
        transform: translateY(-2px);

        .overview-value,
        .overview-label {
          color: @text-color-inverse;
        }
      }

      .overview-value {
        font-size: @font-size-h1;
        font-weight: @font-weight-bold;
        color: @primary-color;
        margin-bottom: @spacing-xs;
        font-family: @font-family-base;
        transition: color @animation-duration-base @animation-timing-function;
      }

      .overview-label {
        font-size: @font-size-sm;
        color: @text-color-secondary;
        font-weight: @font-weight-medium;
        transition: color @animation-duration-base @animation-timing-function;
      }
    }
  }

  .subject-list {
    padding: @spacing-md 0;

    .subject-item {
      margin-bottom: @spacing-md;
      padding: @spacing-sm;
      background: @background-dark;
      border-radius: @border-radius-sm;
      transition: all @animation-duration-base @animation-timing-function;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        background: fade(@primary-color, 5%);
        transform: translateX(4px);
      }

      .subject-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: @spacing-xs;

        .subject-name {
          font-weight: @font-weight-semibold;
          color: @text-color;
          font-size: @font-size-base;
        }

        .subject-percentage {
          font-weight: @font-weight-bold;
          color: @primary-color;
          font-size: @font-size-lg;
        }
      }

      .subject-detail {
        display: flex;
        justify-content: space-between;
        font-size: @font-size-sm;
        color: @text-color-secondary;
        margin-top: @spacing-xs;
      }
    }
  }

  .trend-chart {
    padding: @spacing-md 0;

    .no-data {
      text-align: center;
      color: @text-color-secondary;
      padding: @spacing-xl 0;
      font-size: @font-size-base;
    }

    .chart-container {
      height: 200px;
      display: flex;
      flex-direction: column;

      .chart-grid {
        flex: 1;
        display: flex;
        align-items: end;
        justify-content: space-between;
        padding: 0 @spacing-xs;
        margin-bottom: @spacing-xs;

        .chart-bar {
          flex: 1;
          background: @card-gradient-bg;
          margin: 0 2px;
          border-radius: @border-radius-sm @border-radius-sm 0 0;
          min-height: 20px;
          position: relative;
          transition: all @animation-duration-base @animation-timing-function;

          &:hover {
            transform: translateY(-4px);
            box-shadow: @shadow-button;
          }

          .bar-value {
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            font-size: @font-size-xs;
            color: @text-color;
            font-weight: @font-weight-semibold;
            white-space: nowrap;
            background: @card-background;
            padding: 2px @spacing-xs;
            border-radius: @border-radius-xs;
            box-shadow: @shadow-card;
            opacity: 0;
            transition: opacity @animation-duration-base
              @animation-timing-function;
          }

          &:hover .bar-value {
            opacity: 1;
          }
        }
      }

      .chart-labels {
        display: flex;
        justify-content: space-between;
        padding: 0 @spacing-xs;

        .chart-label {
          flex: 1;
          text-align: center;
          font-size: @font-size-xs;
          color: @text-color-secondary;
          font-weight: @font-weight-medium;
        }
      }
    }
  }

  .habit-items {
    padding: @spacing-md 0;

    .habit-item {
      display: flex;
      align-items: center;
      padding: @spacing-sm 0;
      border-bottom: 1px solid @border-color-light;
      transition: all @animation-duration-base @animation-timing-function;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        padding-left: @spacing-xs;
        background: fade(@primary-color, 3%);
      }

      .van-icon {
        font-size: @font-size-h2;
        color: @primary-color;
        margin-right: @spacing-sm;
        padding: @spacing-xs;
        background: fade(@primary-color, 10%);
        border-radius: @border-radius-round;
      }

      .habit-content {
        flex: 1;

        .habit-title {
          font-size: @font-size-base;
          color: @text-color-secondary;
          margin-bottom: 2px;
          font-weight: @font-weight-medium;
        }

        .habit-value {
          font-size: @font-size-lg;
          font-weight: @font-weight-semibold;
          color: @text-color;
        }
      }
    }
  }
}

/* 现代化加载状态 */
.loading-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: @z-index-modal;

  .van-loading {
    color: @primary-color;
  }
}

/* 现代化进度条样式 */
:deep(.van-progress) {
  &__portion {
    border-radius: @border-radius-lg;
  }

  &__pivot {
    background: @primary-color;
    border-radius: @border-radius-lg;
    font-weight: @font-weight-semibold;
    font-size: @font-size-sm;
  }
}

/* 响应式设计优化 */
@media (max-width: @screen-sm) {
  .overview-stats,
  .subject-stats,
  .daily-trend,
  .habit-analysis {
    margin: 0 @spacing-xs @spacing-xs;

    .overview-grid {
      gap: @spacing-sm;

      .overview-item {
        padding: @spacing-xs;

        .overview-value {
          font-size: @font-size-h2;
        }
      }
    }

    .trend-chart {
      .chart-container {
        height: 160px;

        .chart-grid {
          .chart-bar {
            .bar-value {
              font-size: 10px;
              padding: 1px @spacing-xs / 2;
            }
          }
        }

        .chart-labels {
          .chart-label {
            font-size: 10px;
          }
        }
      }
    }

    .habit-items {
      .habit-item {
        .van-icon {
          font-size: @font-size-lg;
          margin-right: @spacing-xs;
        }

        .habit-content {
          .habit-title {
            font-size: @font-size-sm;
          }

          .habit-value {
            font-size: @font-size-base;
          }
        }
      }
    }
  }

  .statistics-view {
    .stats-card {
      padding: @spacing-sm;

      .card-title {
        font-size: @font-size-lg;
      }
    }
  }
}

@media (max-width: @screen-xs) {
  .overview-stats,
  .subject-stats,
  .daily-trend,
  .habit-analysis {
    .overview-grid {
      gap: @spacing-xs;

      .overview-item {
        .overview-value {
          font-size: @font-size-lg;
        }

        .overview-label {
          font-size: @font-size-xs;
        }
      }
    }
  }
}
</style>
