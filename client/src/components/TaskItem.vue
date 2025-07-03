<template>
  <div
    class="task-item"
    :class="{ completed: localTask.isCompleted, readonly: readonly }"
  >
    <van-cell>
      <template #icon>
        <van-checkbox
          v-model="localTask.isCompleted"
          :disabled="readonly"
          @change="onToggleComplete"
          checked-color="#1989fa"
        />
      </template>

      <template #title>
        <div class="task-content">
          <div class="task-title" :class="{ completed: localTask.isCompleted }">
            {{ localTask.title }}
          </div>

          <div v-if="localTask.description" class="task-description">
            {{ localTask.description }}
          </div>

          <div class="task-meta">
            <van-tag
              :color="getSubjectColor(localTask.subject)"
              size="mini"
              plain
            >
              {{ localTask.subject }}
            </van-tag>

            <span v-if="localTask.deadline" class="deadline">
              <van-icon name="clock-o" />
              {{ formatDeadline(localTask.deadline) }}
            </span>

            <span v-if="localTask.completedAt" class="completed-time">
              <van-icon name="checked" />
              {{ formatCompletedTime(localTask.completedAt) }}
            </span>
          </div>
        </div>
      </template>

      <template #right-icon v-if="!readonly">
        <van-icon
          name="ellipsis"
          @click="showActionSheet = true"
          class="task-actions"
        />
      </template>
    </van-cell>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model="showActionSheet"
      :actions="actions"
      @select="onActionSelect"
      cancel-text="取消"
    />

    <!-- 编辑任务弹窗 -->
    <van-popup
      v-model="showEditTask"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="edit-task-popup">
        <div class="popup-header">
          <van-button plain @click="showEditTask = false">取消</van-button>
          <h3>编辑任务</h3>
          <van-button type="primary" @click="onSaveEdit" :loading="saving"
            >保存</van-button
          >
        </div>

        <div class="popup-content">
          <van-cell-group>
            <van-field
              v-model="editForm.title"
              label="任务标题"
              placeholder="请输入任务标题"
              required
            />

            <van-field
              v-model="editForm.description"
              label="任务描述"
              placeholder="请输入任务描述（可选）"
              type="textarea"
              rows="2"
            />

            <van-field
              v-model="editForm.subject"
              label="选择科目"
              placeholder="请选择科目"
              readonly
              is-link
              @click="onEditSubjectFieldClick"
            />

            <van-field
              v-model="editForm.deadline"
              label="截止时间"
              placeholder="请选择截止时间"
              readonly
              @click="showEditDatePicker = true"
            />
          </van-cell-group>
        </div>
      </div>
    </van-popup>

    <!-- 编辑日期选择器 -->
    <van-popup v-model="showEditDatePicker" position="bottom">
      <van-datetime-picker
        v-model="editPickerDate"
        type="datetime"
        title="选择截止时间"
        @confirm="onEditDateConfirm"
        @cancel="showEditDatePicker = false"
      />
    </van-popup>

    <!-- 编辑科目选择器 -->
    <van-popup v-model="showEditSubjectPicker" position="bottom">
      <van-picker
        :columns="subjects"
        title="选择科目"
        @confirm="onEditSubjectConfirm"
        @cancel="onEditSubjectCancel"
        show-toolbar
      />
    </van-popup>
  </div>
</template>

<script>
import { mapState } from "vuex";
import dayjs from "dayjs";
import { getSubjectColor } from "@/config/subjects";

export default {
  name: "TaskItem",

  props: {
    task: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      localTask: { ...this.task },
      showActionSheet: false,
      showEditTask: false,
      showEditDatePicker: false,
      showEditSubjectPicker: false,
      saving: false,
      editPickerDate: new Date(),
      editForm: {
        title: "",
        description: "",
        subject: "",
        deadline: "",
      },
    };
  },

  computed: {
    ...mapState(["subjects"]),

    actions() {
      return [
        {
          name: "编辑任务",
          color: "#1989fa",
        },
        {
          name: "删除任务",
          color: "#ee0a24",
        },
      ];
    },
  },

  watch: {
    task: {
      handler(newTask) {
        this.localTask = { ...newTask };
      },
      deep: true,
      immediate: true,
    },
  },

  methods: {
    async onToggleComplete(checked) {
      // 如果是数学科目且要标记为完成，弹出确认窗口
      if (checked && this.task.subject === "数学") {
        try {
          await this.$dialog.confirm({
            title: "确认完成",
            message: "你确认已经全部检查过吗？",
            confirmButtonText: "确定",
            cancelButtonText: "取消",
          });
        } catch (error) {
          // 用户取消了确认，恢复复选框状态
          this.localTask.isCompleted = false;
          return;
        }
      }

      const updates = {
        isCompleted: checked,
        completedAt: checked ? new Date().toISOString() : null,
      };

      this.$emit("update", this.task._id, updates);
    },

    onActionSelect(action) {
      if (action.name === "编辑任务") {
        this.openEditTask();
      } else if (action.name === "删除任务") {
        this.$emit("delete", this.task._id);
      }
      this.showActionSheet = false;
    },

    openEditTask() {
      this.editForm = {
        title: this.task.title,
        description: this.task.description || "",
        subject: this.task.subject,
        deadline: this.task.deadline || "",
      };
      this.showEditTask = true;
    },

    async onSaveEdit() {
      if (!this.editForm.title.trim()) {
        this.$toast.fail("请输入任务标题");
        return;
      }

      try {
        this.saving = true;

        const updates = {
          title: this.editForm.title,
          description: this.editForm.description,
          subject: this.editForm.subject,
          deadline: this.editForm.deadline,
        };

        this.$emit("update", this.task._id, updates);
        this.showEditTask = false;
      } catch (error) {
        this.$toast.fail("保存失败: " + error.message);
      } finally {
        this.saving = false;
      }
    },

    onEditDateConfirm(value) {
      this.editForm.deadline = dayjs(value).format("YYYY-MM-DD HH:mm");
      this.showEditDatePicker = false;
    },

    onEditSubjectFieldClick() {
      this.showEditSubjectPicker = true;
    },

    onEditSubjectConfirm(value) {
      this.editForm.subject = value;
      this.showEditSubjectPicker = false;
    },

    onEditSubjectCancel() {
      this.showEditSubjectPicker = false;
    },

    getSubjectColor,

    formatDeadline(deadline) {
      if (!deadline) return "";
      return dayjs(deadline).format("MM-DD HH:mm");
    },

    formatCompletedTime(completedAt) {
      if (!completedAt) return "";
      return dayjs(completedAt).format("HH:mm完成");
    },
  },
};
</script>

<style lang="less" scoped>
.task-item {
  background: @card-background;
  border-radius: @border-radius-lg;
  box-shadow: @card-shadow;
  margin-bottom: @spacing-xs;
  overflow: hidden;
  transition: all @animation-duration-base @animation-timing-function;
  border: 1px solid @border-color-light;
  font-family: @font-family-base;

  &:hover {
    box-shadow: @shadow-float;
    transform: translateY(-2px);
    border-color: @primary-color;
  }

  &.completed {
    opacity: 0.7;
    background: @background-dark;

    .task-title {
      text-decoration: line-through;
      color: @text-color-secondary;
    }
  }

  &.readonly {
    opacity: 0.8;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: @card-shadow;
      border-color: @border-color-light;
    }
  }

  &:active {
    transform: translateY(0);
  }

  .van-cell {
    padding: @spacing-md;
    background: transparent;
    border: none;
    transition: all @animation-duration-base @animation-timing-function;

    &::after {
      display: none;
    }

    &:hover {
      background: fade(@primary-color, 5%);
    }
  }

  .van-checkbox {
    align-items: flex-start;
    margin-top: 2px;

    :deep(.van-checkbox__icon) {
      font-size: @icon-size-base;

      &--checked {
        color: @primary-color;
      }
    }
  }

  .task-content {
    width: 100%;
    margin-left: @spacing-sm;

    .task-title {
      font-size: @font-size-lg;
      font-weight: @font-weight-semibold;
      color: @text-color;
      margin-bottom: @spacing-xs;
      line-height: @line-height-base;
      letter-spacing: -0.2px;

      &.completed {
        text-decoration: line-through;
        color: @text-color-secondary;
      }
    }

    .task-description {
      font-size: @font-size-base;
      color: @text-color-secondary;
      margin-bottom: @spacing-xs;
      line-height: @line-height-base;
      padding: @spacing-xs 0;
    }

    .task-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: @spacing-xs;
      font-size: @font-size-sm;
      color: @text-color-secondary;

      .van-tag {
        border-radius: @border-radius-lg;
        font-weight: @font-weight-medium;
        font-size: @font-size-xs;
      }

      .deadline,
      .completed-time {
        display: flex;
        align-items: center;
        gap: @spacing-xs / 2;
        padding: 2px @spacing-xs;
        background: @background-dark;
        border-radius: @border-radius-sm;
        font-weight: @font-weight-medium;

        .van-icon {
          font-size: @font-size-sm;
        }
      }

      .deadline {
        color: @accent-blue;
      }

      .completed-time {
        color: @accent-green;
      }
    }
  }

  .task-actions {
    color: @text-color-secondary;
    font-size: @font-size-lg;
    padding: @spacing-xs;
    border-radius: @border-radius-sm;
    transition: all @animation-duration-base @animation-timing-function;

    &:hover {
      color: @primary-color;
      background: fade(@primary-color, 10%);
    }
  }
}

/* 现代化编辑弹窗样式 */
.edit-task-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: @card-background;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: @spacing-md;
    border-bottom: 1px solid @border-color-light;
    background: @card-background;

    h3 {
      margin: 0;
      font-size: @font-size-h3;
      font-weight: @font-weight-semibold;
      color: @text-color;
    }

    .van-button {
      border-radius: @border-radius-sm;
      font-weight: @font-weight-medium;
    }
  }

  .popup-content {
    flex: 1;
    padding: @spacing-md;
    overflow-y: auto;
    background: @background-dark;

    .van-cell-group {
      background: transparent;
    }

    .van-field {
      margin-bottom: @spacing-sm;
      background: @card-background;
      border-radius: @border-radius-sm;
      border: 1px solid @border-color-light;
      transition: all @animation-duration-base @animation-timing-function;

      &:focus-within {
        border-color: @primary-color;
        box-shadow: 0 0 0 2px fade(@primary-color, 20%);
      }

      &::after {
        display: none;
      }

      /* 调整label垂直居中和间距 */
      :deep(.van-field__label) {
        display: flex;
        align-items: center;
        min-height: 40px;
        padding: @spacing-xs / 2 0;
        font-size: @font-size-base;
        font-weight: @font-weight-medium;
        width: 80px;
        flex-shrink: 0;
      }

      :deep(.van-field__control) {
        padding: @spacing-xs @spacing-xs;
        font-size: @font-size-base;
        line-height: @line-height-base;
      }

      :deep(.van-field__body) {
        padding: @spacing-xs / 2 @spacing-xs;
        min-height: 40px;
        display: flex;
        align-items: center;
      }

      /* textarea特殊处理 */
      &.van-field--textarea {
        :deep(.van-field__label) {
          align-items: flex-start;
          padding-top: @spacing-xs;
        }

        :deep(.van-field__body) {
          align-items: stretch;
        }

        :deep(.van-field__control) {
          padding: @spacing-xs @spacing-xs;
          min-height: 70px;
        }
      }

      /* 只读字段样式 */
      &.van-field--readonly {
        :deep(.van-field__control) {
          color: @text-color-secondary;
          background: @background-dark;
        }
      }
    }
  }
}

/* 现代化操作表样式 */
:deep(.van-action-sheet) {
  border-radius: @border-radius-lg @border-radius-lg 0 0;

  .van-action-sheet__header {
    background: @card-background;
    border-bottom: 1px solid @border-color-light;
  }

  .van-action-sheet__item {
    font-weight: @font-weight-medium;
    font-size: @font-size-base;
    transition: all @animation-duration-base @animation-timing-function;

    &:hover {
      background: @background-dark;
    }

    &:active {
      background: fade(@primary-color, 10%);
    }
  }

  .van-action-sheet__cancel {
    background: @card-background;
    font-weight: @font-weight-semibold;
  }
}

/* iPad和中等屏幕优化 (768px - 1024px) */
@media (min-width: @screen-md) and (max-width: 1024px) {
  .task-item {
    .van-cell {
      padding: @spacing-sm; /* 减少iPad上的padding */
    }

    .task-content {
      margin-left: @spacing-xs;

      .task-title {
        font-size: @font-size-base; /* 减少标题字体大小 */
        margin-bottom: @spacing-xs / 2;
      }

      .task-description {
        font-size: @font-size-sm;
        margin-bottom: @spacing-xs / 2;
        padding: @spacing-xs / 2 0;
      }

      .task-meta {
        font-size: @font-size-xs;
        gap: @spacing-xs / 2;

        .van-tag {
          font-size: @font-size-xxs;
          padding: 2px @spacing-xs / 2;
        }

        .deadline,
        .completed-time {
          padding: 2px @spacing-xs / 2;
          font-size: @font-size-xs;

          .van-icon {
            font-size: @font-size-xs;
          }
        }
      }
    }

    .task-actions {
      font-size: @font-size-base;
      padding: @spacing-xs / 2;
    }
  }
}

/* 响应式设计 */
@media (max-width: @screen-sm) {
  .task-item {
    margin-bottom: @spacing-xs / 2;

    .van-cell {
      padding: @spacing-xs @spacing-sm; /* 进一步减少小屏幕padding */
    }

    .task-content {
      margin-left: @spacing-xs;

      .task-title {
        font-size: @font-size-sm; /* 小屏幕更小字体 */
        margin-bottom: @spacing-xs / 2;
      }

      .task-description {
        font-size: @font-size-xs;
        margin-bottom: @spacing-xs / 2;
        padding: @spacing-xs / 2 0;
      }

      .task-meta {
        font-size: @font-size-xs;
        gap: @spacing-xs / 2;

        .van-tag {
          font-size: @font-size-xxs;
          padding: 1px @spacing-xs / 2;
        }

        .deadline,
        .completed-time {
          padding: 1px @spacing-xs / 2;
          font-size: @font-size-xxs;

          .van-icon {
            font-size: @font-size-xs;
          }
        }
      }
    }

    .task-actions {
      font-size: @font-size-base;
      padding: @spacing-xs / 2;
    }
  }

  .edit-task-popup {
    .popup-header {
      padding: @spacing-sm;

      h3 {
        font-size: @font-size-lg;
      }
    }

    .popup-content {
      padding: @spacing-sm;
    }
  }
}

@media (max-width: @screen-xs) {
  .task-item {
    .task-content {
      .task-title {
        font-size: @font-size-sm;
        font-weight: @font-weight-medium;
      }

      .task-description {
        font-size: @font-size-xs;
      }

      .task-meta {
        .van-tag {
          font-size: @font-size-tiny;
          padding: 1px 4px;
        }

        .deadline,
        .completed-time {
          font-size: @font-size-xxs;
          padding: 1px 4px;
        }
      }
    }
  }
}
</style>
