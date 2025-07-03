<template>
  <div class="date-navigator">
    <!-- 超紧凑单行布局 -->
    <div class="date-nav-ultra-compact">
      <!-- 左侧：昨天按钮 -->
      <van-button
        icon="arrow-left"
        size="mini"
        type="default"
        plain
        @click="previousDay"
        :disabled="!canGoPrevious"
        class="nav-btn-mini"
      />

      <!-- 今天按钮 -->
      <van-button
        size="mini"
        :type="isCurrentToday ? 'primary' : 'default'"
        :plain="!isCurrentToday"
        @click="goToToday"
        class="today-btn-mini"
      >
        今天
      </van-button>

      <!-- 中间：当前日期显示 -->
      <div class="current-date-ultra" @click="showDatePicker = true">
        <div class="date-info">
          <span class="date-text">{{ formatDisplayDate(currentDate) }}</span>
          <span class="weekday">({{ getWeekday(currentDate) }})</span>
        </div>
        <van-icon name="arrow-down" size="12" class="dropdown-icon" />
      </div>

      <!-- 右侧：明天按钮 -->
      <van-button
        icon="arrow"
        size="mini"
        type="default"
        plain
        @click="nextDay"
        :disabled="!canGoNext"
        class="nav-btn-mini"
      />
    </div>

    <!-- 日期选择器弹窗 -->
    <van-popup v-model="showDatePicker" position="bottom">
      <van-datetime-picker
        v-model="pickerDate"
        type="date"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 日历视图弹窗 -->
    <van-popup
      v-model="showCalendar"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <van-calendar
        v-model="calendarDate"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onCalendarConfirm"
        @close="showCalendar = false"
      />
    </van-popup>
  </div>
</template>

<script>
import { mapState } from "vuex";
import dayjs from "dayjs";

export default {
  name: "DateNavigator",

  props: {
    allowFuture: {
      type: Boolean,
      default: true,
    },
    allowPast: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      showDatePicker: false,
      showCalendar: false,
      pickerDate: new Date(),
      calendarDate: new Date(),

      // 日期范围限制
      minDate: dayjs().subtract(1, "year").toDate(),
      maxDate: dayjs().add(1, "year").toDate(),
    };
  },

  computed: {
    ...mapState(["currentDate"]),

    canGoPrevious() {
      if (!this.allowPast) return false;
      const yesterday = dayjs(this.currentDate).subtract(1, "day");
      return yesterday.isAfter(dayjs(this.minDate));
    },

    canGoNext() {
      if (!this.allowFuture) return false;
      const tomorrow = dayjs(this.currentDate).add(1, "day");
      return tomorrow.isBefore(dayjs(this.maxDate));
    },

    // 检查当前日期是否是昨天
    isYesterday() {
      const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      return this.currentDate === yesterday;
    },

    // 检查当前日期是否是明天
    isTomorrow() {
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      return this.currentDate === tomorrow;
    },

    // 检查当前日期是否是今天
    isCurrentToday() {
      const today = dayjs().format("YYYY-MM-DD");
      return this.currentDate === today;
    },
  },

  methods: {
    // 格式化显示日期
    formatDisplayDate(date) {
      const d = dayjs(date);
      const today = dayjs();

      if (d.isSame(today, "day")) {
        return "今天";
      } else if (d.isSame(today.subtract(1, "day"), "day")) {
        return "昨天";
      } else if (d.isSame(today.add(1, "day"), "day")) {
        return "明天";
      } else {
        return d.format("MM月DD日");
      }
    },

    // 获取星期几
    getWeekday(date) {
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return weekdays[dayjs(date).day()];
    },

    // 检查是否是今天
    isToday(date) {
      return dayjs(date).isSame(dayjs(), "day");
    },

    // 前一天
    async previousDay() {
      if (this.canGoPrevious) {
        const previousDate = dayjs(this.currentDate)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        await this.$store.dispatch("changeDate", previousDate);
      }
    },

    // 后一天
    async nextDay() {
      if (this.canGoNext) {
        const nextDate = dayjs(this.currentDate)
          .add(1, "day")
          .format("YYYY-MM-DD");
        await this.$store.dispatch("changeDate", nextDate);
      }
    },

    // 跳转到今天
    async goToToday() {
      const today = dayjs().format("YYYY-MM-DD");
      await this.$store.dispatch("changeDate", today);
    },

    // 日期选择器确认
    async onDateConfirm(value) {
      const selectedDate = dayjs(value).format("YYYY-MM-DD");
      await this.$store.dispatch("changeDate", selectedDate);
      this.showDatePicker = false;
    },

    // 日历确认
    async onCalendarConfirm(value) {
      const selectedDate = dayjs(value).format("YYYY-MM-DD");
      await this.$store.dispatch("changeDate", selectedDate);
      this.showCalendar = false;
    },
  },
};
</script>

<style lang="less" scoped>
.date-navigator {
  background: @card-background;
  padding: @spacing-xs / 2 @spacing-xs;
  border-bottom: 1px solid @border-color-light;
  box-shadow: @card-shadow;
  font-family: @font-family-base;

  .date-nav-ultra-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: @spacing-xs / 2;

    .nav-btn-mini {
      flex: 0 0 auto;
      border-radius: @border-radius-xs;
      transition: all @animation-duration-base @animation-timing-function;
      width: 28px;
      height: 28px;
      padding: 0;

      &:not(:disabled) {
        &:hover {
          transform: translateY(-1px);
          box-shadow: @shadow-button;
        }
      }

      &:disabled {
        opacity: 0.3;
      }
    }

    .today-btn-mini {
      flex: 0 0 auto;
      border-radius: @border-radius-xs;
      font-size: @font-size-xs;
      font-weight: @font-weight-medium;
      transition: all @animation-duration-base @animation-timing-function;
      height: 28px;
      padding: 0 @spacing-xs;
      min-width: 40px;

      &:not(:disabled) {
        &:hover {
          transform: translateY(-1px);
          box-shadow: @shadow-button;
        }
      }
    }

    .current-date-ultra {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: @spacing-xs / 2 @spacing-xs;
      border-radius: @border-radius-xs;
      transition: all @animation-duration-base @animation-timing-function;
      background: fade(@primary-color, 8%);
      border: 1px solid fade(@primary-color, 15%);
      flex: 1;
      justify-content: center;
      max-width: 145px;
      height: 26px;
      gap: 4px;

      &:hover {
        background: fade(@primary-color, 12%);
        transform: translateY(-1px);
        box-shadow: @shadow-button;
      }

      &:active {
        transform: translateY(0);
      }

      .date-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        line-height: 1;
        gap: 4px;

        .date-text {
          font-size: @font-size-sm;
          font-weight: @font-weight-semibold;
          color: @text-color;
          line-height: 1;
        }

        .weekday {
          font-size: @font-size-xs;
          color: @text-color-secondary;
          font-weight: @font-weight-regular;
          line-height: 1;
        }
      }

      .dropdown-icon {
        color: @text-color-secondary;
        opacity: 0.6;
        flex: 0 0 auto;
      }
    }
  }
}

/* 现代化日期选择器和日历样式 */
:deep(.van-popup) {
  border-radius: @border-radius-lg @border-radius-lg 0 0;
  overflow: hidden;
}

:deep(.van-datetime-picker) {
  background: @card-background;

  .van-picker__toolbar {
    background: @card-background;
    border-bottom: 1px solid @border-color-light;

    .van-picker__title {
      font-weight: @font-weight-semibold;
      color: @text-color;
    }

    .van-picker__confirm,
    .van-picker__cancel {
      font-weight: @font-weight-medium;
    }

    .van-picker__confirm {
      color: @primary-color;
    }

    .van-picker__cancel {
      color: @text-color-secondary;
    }
  }

  .van-picker-column__item {
    font-family: @font-family-base;
    transition: all @animation-duration-base @animation-timing-function;

    &--selected {
      color: @primary-color;
      font-weight: @font-weight-semibold;
    }
  }
}

:deep(.van-calendar) {
  background: @card-background;

  .van-calendar__header {
    background: @card-background;
    border-bottom: 1px solid @border-color-light;
    box-shadow: @card-shadow;
  }

  .van-calendar__title {
    font-weight: @font-weight-semibold;
    color: @text-color;
  }

  .van-calendar__confirm {
    background: @primary-color;
    border-radius: @border-radius-sm;
    font-weight: @font-weight-semibold;
  }

  .van-calendar__weekdays {
    background: @background-dark;
  }

  .van-calendar__day {
    transition: all @animation-duration-base @animation-timing-function;
    border-radius: @border-radius-sm;
    font-family: @font-family-base;

    &:hover {
      background: fade(@primary-color, 10%);
    }

    &--selected {
      background: @primary-color;
      border-radius: @border-radius-sm;
    }

    &--today {
      color: @primary-color;
      font-weight: @font-weight-semibold;
    }
  }
}

/* iPad和中等屏幕优化 (768px - 1024px) */
@media (min-width: @screen-md) and (max-width: 1024px) {
  .date-navigator {
    padding: @spacing-xs / 3 @spacing-xs / 2;

    .date-nav-ultra-compact {
      gap: @spacing-xs / 3;

      .nav-btn-mini {
        width: 26px;
        height: 26px;
      }

      .today-btn-mini {
        height: 26px;
        min-width: 38px;
        font-size: @font-size-xs;
      }

      .current-date-ultra {
        height: 24px;
        max-width: 145px;
        padding: 2px @spacing-xs / 2;

        .date-info {
          gap: 3px;

          .date-text {
            font-size: @font-size-sm;
          }

          .weekday {
            font-size: @font-size-xs;
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: @screen-sm) {
  .date-navigator {
    padding: @spacing-xs / 4 @spacing-xs / 2;

    .date-nav-ultra-compact {
      gap: @spacing-xs / 4;

      .nav-btn-mini {
        width: 22px;
        height: 22px;
      }

      .today-btn-mini {
        height: 22px;
        min-width: 32px;
        font-size: @font-size-xxs;
      }

      .current-date-ultra {
        height: 20px;
        max-width: 145px;
        padding: 1px @spacing-xs / 2;

        .date-info {
          gap: 2px;

          .date-text {
            font-size: @font-size-xs;
          }

          .weekday {
            font-size: @font-size-xxs;
          }
        }

        .dropdown-icon {
          font-size: 10px;
        }
      }
    }
  }
}

@media (max-width: @screen-xs) {
  .date-navigator {
    .date-nav-ultra-compact {
      .current-date-ultra {
        max-width: 140px;
        height: 22px;

        .date-info {
          gap: 2px;

          .date-text {
            font-size: @font-size-xs;
          }

          .weekday {
            font-size: @font-size-xxs;
          }
        }
      }
    }
  }
}
</style>
