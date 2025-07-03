<template>
  <div class="task-board">
    <!-- 固定头部 -->
    <div class="fixed-header" :class="{ scrolled: isScrolled }">
      <!-- 导航栏 -->
      <van-nav-bar
        :title="navTitle"
        :left-arrow="!isToday"
        @click-left="onBack"
      >
        <template #right>
          <div class="nav-right-icons">
            <van-icon name="chat-o" @click="gotoChatbot" class="nav-icon" />
            <van-icon
              name="add-o"
              @click="showAddTask = true"
              v-if="isToday"
              class="nav-icon"
            />
            <van-icon
              name="manager-o"
              @click="showUserMenu = true"
              class="nav-icon user-icon"
              v-if="$store.state.isLoggedIn"
            />
          </div>
        </template>
      </van-nav-bar>

      <!-- 日期导航器 -->
      <DateNavigator />
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 任务统计 -->
      <div class="task-stats" v-if="currentTasks.length > 0">
        <div class="overall-progress">
          <div class="progress-text">
            <span>今日完成进度</span>
            <span class="progress-ratio">{{ progressPivotText }}</span>
          </div>
          <van-progress
            :percentage="currentTasksStats.percentage"
            color="#1989fa"
            stroke-width="6px"
            :show-pivot="shouldShowPivot"
            :pivot-text="progressPivotText"
            pivot-color="#1989fa"
          />
        </div>

        <!-- 各科目进度 - 环形进度条横向布局 -->
        <div class="subjects-progress">
          <div class="subjects-scroll-container">
            <div
              v-for="(stats, subject) in activeSubjectStats"
              :key="subject"
              class="subject-circle-item"
            >
              <van-circle
                :value="(stats.completed / stats.total) * 100"
                :color="getSubjectColor(subject)"
                :size="40"
                :stroke-width="80"
                layer-color="#ebedf0"
                :text="`${stats.completed}/${stats.total}`"
                class="subject-circle"
              />
              <div class="subject-name">
                {{ subject }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="task-list">
          <!-- 按科目分组显示任务 -->
          <div
            v-for="subject in subjects"
            :key="subject"
            class="subject-section"
          >
            <template v-if="tasksBySubject[subject].length > 0"
              ><div class="subject-header">
                <van-icon :name="getSubjectIcon(subject)" />
                <span>{{ subject }}</span>
                <van-tag :color="getSubjectColor(subject)" plain>
                  {{ tasksBySubject[subject].length }}
                </van-tag>
              </div>

              <div class="subject-tasks">
                <TaskItem
                  v-for="task in tasksBySubject[subject]"
                  :key="task._id"
                  :task="task"
                  :readonly="isTaskReadonly(task)"
                  @update="onUpdateTask"
                  @delete="onDeleteTask"
                /></div
            ></template>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && currentTasks.length === 0" class="empty-state">
            <van-empty
              :description="
                isToday ? '还没有任务，点击右上角添加' : '该日期没有任务记录'
              "
              image="search"
            />
          </div>
        </div>
      </van-pull-refresh>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-skeleton">
        <van-skeleton title :row="2" />
        <van-skeleton title :row="2" />
        <van-skeleton title :row="2" />
      </div>

      <!-- 添加任务弹窗 -->
      <van-popup
        v-model="showAddTask"
        position="bottom"
        :style="{ height: '60%' }"
      >
        <div class="add-task-popup">
          <div class="popup-header">
            <van-button plain @click="showAddTask = false">取消</van-button>
            <h3>添加任务</h3>
            <van-button type="primary" @click="onAddTask" :loading="submitting"
              >确定</van-button
            >
          </div>

          <div class="popup-content">
            <van-cell-group>
              <van-field
                v-model="newTask.title"
                label="任务标题"
                placeholder="请输入任务标题"
                required
              />

              <van-field
                v-model="newTask.description"
                label="任务描述"
                placeholder="请输入任务描述（可选）"
                type="textarea"
                rows="2"
              />

              <van-field
                v-model="newTask.subject"
                label="选择科目"
                placeholder="请选择科目"
                readonly
                is-link
                @click="onSubjectFieldClick"
              />

              <van-field
                v-model="newTask.deadline"
                label="截止时间"
                placeholder="请选择截止时间"
                readonly
                @click="showDatePicker = true"
              />
            </van-cell-group>
          </div>
        </div>
      </van-popup>

      <!-- 科目选择器 -->
      <van-popup v-model="showSubjectPicker" position="bottom">
        <van-picker
          :columns="subjects"
          title="选择科目"
          @confirm="onSubjectConfirm"
          @cancel="onSubjectCancel"
          show-toolbar
        />
      </van-popup>

      <!-- 日期时间选择器 -->
      <van-popup v-model="showDatePicker" position="bottom">
        <van-datetime-picker
          v-model="pickerDate"
          type="datetime"
          title="选择截止时间"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>

      <!-- 奖励弹窗 -->
      <RewardModal
        :visible="showRewardModal"
        :type="rewardType"
        :subject-name="completedSubjectName"
        @close="onCloseRewardModal"
      />

      <!-- 用户菜单弹窗 -->
      <van-popup v-model="showUserMenu" position="bottom">
        <div class="user-menu-popup">
          <div class="popup-header">
            <h3>用户信息</h3>
            <van-icon name="cross" @click="showUserMenu = false" />
          </div>

          <div class="user-info">
            <div class="user-avatar">
              <van-icon name="manager-o" size="40" />
            </div>
            <div class="user-details">
              <div class="user-name">
                {{ $store.getters.userName || "用户" }}
              </div>
              <div class="user-email">{{ $store.getters.userEmail }}</div>
            </div>
          </div>

          <van-cell-group>
            <van-cell
              title="子账户管理"
              icon="friends-o"
              is-link
              @click="openSubAccountManage"
              v-if="isMainAccount"
            />
            <van-cell
              title="退出登录"
              icon="exit"
              is-link
              @click="handleLogout"
            />
          </van-cell-group>
        </div>
      </van-popup>

      <!-- 子账户管理弹窗 -->
      <van-popup
        v-model="showSubAccountManage"
        position="bottom"
        :style="{ height: '60%' }"
      >
        <div class="sub-account-manage-popup">
          <div class="popup-header">
            <van-button plain @click="showSubAccountManage = false"
              >关闭</van-button
            >
            <h3>子账户管理</h3>
            <van-button type="primary" @click="openAddSubAccount"
              >邀请</van-button
            >
          </div>

          <div class="popup-content">
            <!-- 当前主账户信息 -->
            <div class="section main-account-section">
              <h4 class="section-title">
                <van-icon name="manager-o" />
                主账户信息
              </h4>
              <div class="main-account-info">
                <div class="account-avatar">
                  <van-icon name="manager-o" size="40" />
                </div>
                <div class="account-details">
                  <div class="account-name">
                    {{ $store.getters.userName || "主账户" }}
                  </div>
                  <div class="account-email">
                    {{ $store.getters.userEmail }}
                  </div>
                  <div class="account-status">
                    <van-tag type="primary" size="mini">主账户</van-tag>
                    <span class="sub-count"
                      >{{ subAccounts.length }} 个子账户</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- 已确认的子账户 -->
            <div class="section">
              <h4 class="section-title">
                <van-icon name="friends-o" />
                已确认的子账户 ({{ subAccounts.length }})
              </h4>
              <div v-if="subAccounts.length === 0" class="empty-hint">
                <van-empty image="network" description="暂无已确认的子账户" />
              </div>
              <van-cell-group v-else>
                <van-cell
                  v-for="subAccount in subAccounts"
                  :key="subAccount.email"
                  :title="subAccount.nickname || subAccount.email.split('@')[0]"
                  :label="subAccount.email"
                  :value="'已确认'"
                >
                  <template #right-icon>
                    <van-button
                      type="danger"
                      size="mini"
                      @click="deleteSubAccount(subAccount.email)"
                    >
                      删除
                    </van-button>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>

            <!-- 待处理的邀请 -->
            <div class="section">
              <h4 class="section-title">
                <van-icon name="send-gift-o" />
                待处理邀请 ({{ pendingInvitations.length }})
              </h4>
              <div v-if="pendingInvitations.length === 0" class="empty-hint">
                <van-empty image="network" description="暂无待处理邀请" />
              </div>
              <van-cell-group v-else>
                <van-cell
                  v-for="invitation in pendingInvitations"
                  :key="invitation.email"
                  :title="invitation.email.split('@')[0]"
                  :label="invitation.email"
                  :value="`已发送 (${formatInviteDate(invitation.invitedAt)})`"
                >
                  <template #icon>
                    <van-icon name="clock-o" />
                  </template>
                  <template #right-icon>
                    <van-button
                      type="warning"
                      size="mini"
                      @click="cancelInvitation(invitation.email)"
                    >
                      取消
                    </van-button>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>
          </div>
        </div>
      </van-popup>

      <!-- 添加子账户弹窗 -->
      <van-popup
        v-model="showAddSubAccount"
        position="bottom"
        :style="{ height: '40%' }"
      >
        <div class="add-sub-account-popup">
          <div class="popup-header">
            <van-button plain @click="showAddSubAccount = false"
              >取消</van-button
            >
            <h3>邀请子账户</h3>
            <van-button
              type="primary"
              @click="addSubAccount"
              :loading="subAccountSubmitting"
            >
              发送邀请
            </van-button>
          </div>

          <div class="popup-content">
            <van-cell-group>
              <van-field
                v-model="newSubAccountEmail"
                label="邮箱地址"
                placeholder="请输入要邀请的邮箱地址"
                type="email"
                required
              />
            </van-cell-group>

            <div class="tip-text">
              <p>• 系统将向该邮箱发送邀请链接</p>
              <p>• 对方需要点击邮件中的链接确认接受邀请</p>
              <p>• 邀请链接7天内有效</p>
              <p>• 接受邀请后，对方将成为您的子账户</p>
              <p>• 子账户将拥有与主账户相同的权限</p>
            </div>
          </div>
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import dayjs from "dayjs";
import DateNavigator from "@/components/DateNavigator.vue";
import TaskItem from "@/components/TaskItem.vue";
import RewardModal from "@/components/RewardModal.vue";
import { getSubjectColor, getSubjectIcon } from "@/config/subjects";
import request from "@/request";

export default {
  name: "TaskBoard",
  components: {
    DateNavigator,
    TaskItem,
    RewardModal,
  },

  props: {
    date: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      refreshing: false,
      showAddTask: false,
      showDatePicker: false,
      showSubjectPicker: false,
      showUserMenu: false,
      showSubAccountManage: false,
      showAddSubAccount: false,
      submitting: false,
      subAccountSubmitting: false,
      pickerDate: new Date(),
      newSubAccountEmail: "",
      subAccounts: [],
      pendingInvitations: [],
      newTask: {
        title: "",
        description: "",
        subject: "语文",
        deadline: "",
      },
      isScrolled: false,
      // 奖励弹窗相关
      showRewardModal: false,
      rewardType: "subject", // 'subject' | 'all'
      completedSubjectName: "",
      // 上一次的完成状态，用于检测变化
      previousSubjectStats: {},
      previousTotalCompletion: false,
    };
  },

  computed: {
    ...mapState(["loading", "subjects", "currentDate"]),
    ...mapGetters([
      "currentTasks",
      "isToday",
      "currentTasksStats",
      "tasksBySubject",
      "subjectStats",
    ]),

    navTitle() {
      if (this.isToday) {
        return "今日任务";
      } else {
        return dayjs(this.currentDate).format("MM月DD日任务");
      }
    },

    // 只包含有任务的科目统计
    activeSubjectStats() {
      const stats = {};
      for (const subject in this.subjectStats) {
        const subjectStat = this.subjectStats[subject];
        // 只包含有任务的科目
        if (subjectStat.total > 0) {
          stats[subject] = subjectStat;
        }
      }
      return stats;
    },

    // 判断是否是主账户
    isMainAccount() {
      // 从store中获取用户信息，判断账户类型
      const user = this.$store.getters.currentUser;
      return !user || user.accountType !== "sub";
    },

    // 控制进度条pivot的显示，避免100%时超出屏幕
    shouldShowPivot() {
      // 当进度小于95%时显示pivot，避免接近100%时超出屏幕
      return (
        this.currentTasksStats.percentage &&
        this.currentTasksStats.percentage < 95
      );
    },

    // 进度条pivot文本
    progressPivotText() {
      if (!this.currentTasksStats.completed && !this.currentTasksStats.total) {
        return "0/0";
      }
      return `${this.currentTasksStats.completed}/${this.currentTasksStats.total}`;
    },
  },

  async created() {
    // 检查用户是否已登录，如果未登录则不加载任务
    if (!this.$store.state.isLoggedIn) {
      console.warn("⚠️ 用户未登录，跳过任务加载");
      return;
    }

    // 如果有日期参数，则切换到指定日期
    if (this.date && this.date !== this.currentDate) {
      await this.$store.dispatch("changeDate", this.date);
    } else {
      // 默认加载当天的任务列表
      await this.$store.dispatch("loadTasks");
    }
  },

  mounted() {
    // 添加滚动监听
    window.addEventListener("scroll", this.handleScroll);
  },

  beforeDestroy() {
    // 移除滚动监听
    window.removeEventListener("scroll", this.handleScroll);
  },

  watch: {
    async date(newDate) {
      if (newDate && newDate !== this.currentDate) {
        await this.$store.dispatch("changeDate", newDate);
      }
    },

    // 监听有任务的科目完成状态变化
    activeSubjectStats: {
      handler(newStats, oldStats) {
        if (!this.isToday || !newStats) return;

        this.checkSubjectCompletion(newStats, oldStats || {});
      },
      deep: true,
      immediate: false,
    },

    // 监听总体完成状态变化
    currentTasksStats: {
      handler(newStats) {
        if (!this.isToday || !newStats) return;

        this.checkTotalCompletion(newStats);
      },
      immediate: false,
    },
  },

  methods: {
    handleScroll() {
      // 当滚动超过10px时，增强阴影效果
      this.isScrolled = window.scrollY > 10;
    },

    onBack() {
      if (this.isToday) {
        return;
      }
      // 返回今日任务，避免重复导航错误
      const currentRoute = this.$route.path;
      if (currentRoute !== "/tasks") {
        this.$router.push("/tasks").catch((err) => {
          // 忽略导航重复错误
          if (err.name !== "NavigationDuplicated") {
            throw err;
          }
        });
      }
    },

    async onRefresh() {
      try {
        // 清除缓存并重新加载
        this.$store.commit("SET_TASKS_CACHE", {
          date: this.currentDate,
          tasks: [],
        });
        await this.$store.dispatch("loadTasks");
      } catch (error) {
        this.$toast.fail("刷新失败: " + error.message);
      } finally {
        this.refreshing = false;
      }
    },

    async onUpdateTask(taskId, updates) {
      try {
        await this.$store.dispatch("updateTask", { taskId, updates });
        // 延迟显示成功提示，避免与loading冲突
        setTimeout(() => {
          this.$toast.success("任务已更新");
        }, 300);
      } catch (error) {
        // 错误提示已在API层延迟处理
      }
    },

    async onDeleteTask(taskId) {
      try {
        await this.$dialog.confirm({
          title: "确认删除",
          message: "确定要删除这个任务吗？",
        });

        await this.$store.dispatch("deleteTask", {
          taskId,
          date: this.currentDate,
        });
        // 延迟显示成功提示，避免与loading冲突
        setTimeout(() => {
          this.$toast.success("任务已删除");
        }, 300);
      } catch (error) {
        if (error !== "cancel") {
          // 错误提示已在API层延迟处理
        }
      }
    },

    async onAddTask() {
      if (!this.newTask.title.trim()) {
        this.$toast.fail("请输入任务标题");
        return;
      }

      try {
        this.submitting = true;

        const taskData = {
          ...this.newTask,
          date: this.currentDate,
          isCompleted: false,
        };

        await this.$store.dispatch("createTask", taskData);

        // 延迟显示成功提示，避免与loading冲突
        setTimeout(() => {
          this.$toast.success("任务添加成功");
        }, 300);
        this.showAddTask = false;
        this.resetNewTask();
      } catch (error) {
        // 错误提示已在API层延迟处理
      } finally {
        this.submitting = false;
      }
    },

    onDateConfirm(value) {
      this.newTask.deadline = dayjs(value).format("YYYY-MM-DD HH:mm");
      this.showDatePicker = false;
    },

    onSubjectFieldClick() {
      this.showSubjectPicker = true;
    },

    onSubjectConfirm(value) {
      this.newTask.subject = value;
      this.showSubjectPicker = false;
    },

    onSubjectCancel() {
      this.showSubjectPicker = false;
    },

    resetNewTask() {
      this.newTask = {
        title: "",
        description: "",
        subject: "语文",
        deadline: "",
      };
    },

    // 奖励弹窗相关方法
    checkSubjectCompletion(newStats, oldStats) {
      // 检查是否有科目刚刚完成（newStats 已经只包含有任务的科目）
      for (const subject in newStats) {
        const newSubjectStats = newStats[subject];
        const oldSubjectStats = oldStats[subject] || { percentage: 0 };

        // 如果某个科目从未完成变为完成状态
        if (
          newSubjectStats.percentage === 100 &&
          oldSubjectStats.percentage < 100
        ) {
          // 先检查是否所有任务都完成了，如果是则显示全部完成奖励
          if (this.currentTasksStats.percentage === 100) {
            this.showAllCompleteReward();
          } else {
            // 否则显示单科完成奖励
            this.showSubjectReward(subject);
          }
          break; // 一次只显示一个奖励
        }
      }
    },

    checkTotalCompletion(newStats) {
      // 这个方法现在主要用于记录状态，实际奖励在 checkSubjectCompletion 中处理
      this.previousTotalCompletion = newStats.percentage === 100;
    },

    showSubjectReward(subjectName) {
      // 防止重复显示
      if (this.showRewardModal) return;

      this.rewardType = "subject";
      this.completedSubjectName = subjectName;
      this.showRewardModal = true;
    },

    showAllCompleteReward() {
      // 防止重复显示
      if (this.showRewardModal) return;

      this.rewardType = "all";
      this.completedSubjectName = "";
      this.showRewardModal = true;
    },

    onCloseRewardModal() {
      this.showRewardModal = false;

      // 延迟重置状态，避免立即重复触发
      setTimeout(() => {
        this.rewardType = "subject";
        this.completedSubjectName = "";
      }, 500);
    },

    gotoChatbot() {
      // 跳转到聊天机器人页面
      this.$router.push("/chatbot");
    },

    isTaskReadonly(task) {
      // 如果是今天，任务可以编辑
      if (this.isToday) {
        return false;
      }

      // 如果没有截止时间，只有今天的任务可以编辑
      if (!task.deadline) {
        return true;
      }

      // 如果有截止时间，检查是否已过期
      const now = dayjs();
      const deadline = dayjs(task.deadline);

      // 如果截止时间未到，任务可以编辑
      return deadline.isBefore(now);
    },

    getSubjectColor,
    getSubjectIcon,

    // 退出登录
    async handleLogout() {
      this.$dialog
        .confirm({
          title: "退出登录",
          message: "确定要退出登录吗？这将清除所有本地缓存数据。",
        })
        .then(async () => {
          try {
            // 显示退出登录的加载状态
            const toast = this.$toast.loading({
              message: "正在退出登录...",
              forbidClick: true,
              duration: 0,
            });

            await this.$store.dispatch("logout");

            // 关闭所有弹窗
            this.showUserMenu = false;
            this.showSubAccountManage = false;
            this.showAddSubAccount = false;
            this.showAddTask = false;

            // 重置组件本地状态
            this.subAccounts = [];
            this.pendingInvitations = [];
            this.newSubAccountEmail = "";

            // 关闭加载提示
            toast.close();

            this.$toast.success("退出登录成功，本地数据已清除");

            // 延迟导航，让用户看到成功消息
            setTimeout(() => {
              this.$router.push("/login");
            }, 500);
          } catch (error) {
            console.error("退出登录失败:", error);
            this.$toast.fail("退出登录失败: " + (error.message || "未知错误"));
          }
        })
        .catch(() => {
          // 用户取消
        });
    },

    // 子账户管理相关方法
    async loadSubAccounts() {
      try {
        // 调用API获取子账户列表
        const response = await request.get("/user/sub-accounts");
        this.subAccounts = response.data || [];
      } catch (error) {
        console.error("获取子账户列表失败:", error);
        this.$toast.fail("获取子账户列表失败");
      }
    },

    async loadPendingInvitations() {
      try {
        // 调用API获取待处理邀请列表
        const response = await request.get("/user/pending-invitations");
        this.pendingInvitations = response.data || [];
      } catch (error) {
        console.error("获取邀请列表失败:", error);
        this.$toast.fail("获取邀请列表失败");
      }
    },

    async openSubAccountManage() {
      this.showUserMenu = false;
      this.showSubAccountManage = true;
      await this.loadSubAccounts();
      await this.loadPendingInvitations();
    },

    openAddSubAccount() {
      this.newSubAccountEmail = "";
      this.showAddSubAccount = true;
    },

    async addSubAccount() {
      if (!this.newSubAccountEmail.trim()) {
        this.$toast.fail("请输入邮箱地址");
        return;
      }

      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.newSubAccountEmail)) {
        this.$toast.fail("请输入有效的邮箱地址");
        return;
      }

      try {
        this.subAccountSubmitting = true;
        await request.post("/user/invite-sub-account", {
          email: this.newSubAccountEmail,
        });

        this.$toast.success("邀请发送成功，请通知对方查收邮件");
        this.showAddSubAccount = false;
        this.newSubAccountEmail = "";
        await this.loadPendingInvitations(); // 重新加载邀请列表
      } catch (error) {
        console.error("发送邀请失败:", error);
        this.$toast.fail(error.response?.data?.message || "发送邀请失败");
      } finally {
        this.subAccountSubmitting = false;
      }
    },

    async cancelInvitation(email) {
      try {
        await this.$dialog.confirm({
          title: "确认取消",
          message: `确定要取消对 ${email} 的邀请吗？`,
        });

        await request.delete(
          `/user/pending-invitations/${encodeURIComponent(email)}`
        );
        this.$toast.success("邀请已取消");
        await this.loadPendingInvitations(); // 重新加载邀请列表
      } catch (error) {
        if (error !== "cancel") {
          console.error("取消邀请失败:", error);
          this.$toast.fail(error.response?.data?.message || "取消邀请失败");
        }
      }
    },

    async deleteSubAccount(email) {
      try {
        await this.$dialog.confirm({
          title: "确认删除",
          message: `确定要删除子账户 ${email} 吗？删除后对方将无法再访问共享任务。`,
        });

        await request.delete(`/user/sub-accounts/${encodeURIComponent(email)}`);
        this.$toast.success("子账户删除成功");
        await this.loadSubAccounts(); // 重新加载子账户列表
      } catch (error) {
        if (error !== "cancel") {
          console.error("删除子账户失败:", error);
          this.$toast.fail(error.response?.data?.message || "删除子账户失败");
        }
      }
    },

    formatInviteDate(dateString) {
      return dayjs(dateString).format("MM-DD HH:mm");
    },
  },
};
</script>

<style lang="less" scoped>
.task-board {
  height: 100vh;
  background-color: @background-dark;
  font-family: @font-family-base;

  /* 现代化固定头部样式 */
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: @z-index-fixed;
    background: @card-background;
    box-shadow: @shadow-card;
    transition: all @animation-duration-base @animation-timing-function;

    /* 滚动时的增强阴影效果 */
    &.scrolled {
      box-shadow: @shadow-float;
    }
  }

  /* 现代化主要内容区域 */
  .main-content {
    padding-top: 110px; /* 为水平排列的紧凑头部留出空间 */

    .task-list {
      padding: 0 @spacing-sm (@layout-tabbar-height + @spacing-md) @spacing-sm;
      min-height: calc(100vh - 200px);

      .subject-section {
        margin-bottom: @spacing-sm;

        .subject-header {
          display: flex;
          align-items: center;
          padding: @spacing-sm @spacing-md;
          font-size: @font-size-h3;
          font-weight: @font-weight-bold;
          color: @text-color;
          background: @card-background;
          border-radius: @border-radius-lg @border-radius-lg 0 0;
          border-bottom: 1px solid @border-color-light;

          .van-icon {
            margin-right: @spacing-sm;
            font-size: @font-size-h3;
            color: @primary-color;
          }

          > span {
            font-size: @font-size-h3;
            font-weight: @font-weight-bold;
            letter-spacing: -0.2px;
            flex: 1;
          }

          .van-tag {
            margin-left: auto;
            font-weight: @font-weight-semibold;
            font-size: @font-size-sm;
            padding: @spacing-xs @spacing-sm;
            border-radius: @border-radius-lg;
            min-width: 28px;
            text-align: center;
            flex: none;
          }
        }

        .subject-tasks {
          background: @card-background;
          border-radius: 0 0 @border-radius-lg @border-radius-lg;
          box-shadow: @card-shadow;
          overflow: hidden;

          /* 移除任务项之间的间隙 */
          :deep(.task-item) {
            border-radius: 0;
            margin-bottom: 0;
            border: none;
            border-bottom: 1px solid @border-color-light;
            box-shadow: none;

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              box-shadow: none;
              transform: none;
              background: @background-dark;
            }
          }
        }
      }
    }

    /* 现代化任务统计区域 */
    .task-stats {
      padding: @spacing-md;
      background: @card-background;
      margin: 0 @spacing-sm @spacing-sm;
      border-radius: @border-radius-lg;
      box-shadow: @card-shadow;
      transition: all @animation-duration-base @animation-timing-function;

      &:hover {
        box-shadow: @shadow-float;
      }

      .overall-progress {
        margin-bottom: @spacing-xs;

        .progress-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: @font-weight-semibold;
          color: @text-color;
          margin-bottom: @spacing-xs;

          .progress-ratio {
            font-size: @font-size-sm;
            color: @primary-color;
            font-weight: @font-weight-bold;
            background: fade(@primary-color, 10%);
            padding: 2px @spacing-xs;
            border-radius: @border-radius-sm;
            border: 1px solid fade(@primary-color, 20%);
          }
        }
      }

      .subjects-progress {
        padding-top: @spacing-xs;

        .subjects-scroll-container {
          display: flex;
          gap: @spacing-md;
          overflow-x: auto;
          padding: 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */

          :deep(.van-circle__text) {
            font-size: @font-size-xs;
            font-weight: @font-weight-semibold;
          }

          &::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }
        }

        .subject-circle-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
          flex-shrink: 0;
          transition: all @animation-duration-base @animation-timing-function;

          &:hover {
            transform: translateY(-2px);
          }

          .subject-circle {
            margin-bottom: @spacing-xs;
            transition: all @animation-duration-base @animation-timing-function;

            &:hover {
              transform: scale(1.05);
            }
          }

          .subject-name {
            font-size: @font-size-sm;
            color: @text-color-secondary;
            text-align: center;
            font-weight: @font-weight-medium;
            line-height: @line-height-base;
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  /* 空状态和加载状态优化 */
  .empty-state {
    padding: @spacing-lg 0;

    :deep(.van-empty) {
      .van-empty__image {
        width: 120px;
        height: 120px;
      }

      .van-empty__description {
        font-size: @font-size-sm;
        color: @text-color-secondary;
        margin-top: @spacing-sm;
      }
    }
  }

  .loading-skeleton {
    padding: @spacing-sm;

    .van-skeleton {
      margin-bottom: @spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

/* 现代化弹窗样式 */
.add-task-popup,
.sub-account-manage-popup,
.add-sub-account-popup {
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
    overflow-y: auto;
    background: @background-dark;

    .van-cell-group {
      background: transparent;
    }
  }
}

/* 添加任务弹窗特殊样式 */
.add-task-popup {
  .popup-content {
    padding: @spacing-md;

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

/* 现代化用户菜单弹窗 */
.user-menu-popup {
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

    .van-icon {
      font-size: @font-size-lg;
      color: @text-color-secondary;
      cursor: pointer;
      transition: all @animation-duration-base @animation-timing-function;

      &:hover {
        color: @primary-color;
        transform: scale(1.1);
      }
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    padding: @spacing-md;
    background: @card-gradient-bg;
    color: @text-color-inverse;

    .user-avatar {
      width: 60px;
      height: 60px;
      border-radius: @border-radius-round;
      background: fade(@background-light, 20%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: @spacing-md;
      box-shadow: @shadow-soft;

      .van-icon {
        color: @text-color-inverse;
        font-size: @font-size-h1;
      }
    }

    .user-details {
      flex: 1;

      .user-name {
        font-size: @font-size-lg;
        font-weight: @font-weight-semibold;
        margin-bottom: @spacing-xs;
        font-family: @font-family-base;
      }

      .user-email {
        font-size: @font-size-sm;
        opacity: 0.9;
        font-family: @font-family-base;
      }
    }
  }
}

/* 子账户管理弹窗样式 */
.sub-account-manage-popup {
  .popup-content {
    padding: @spacing-sm;

    .section {
      margin-bottom: @spacing-md;
      background: @card-background;
      border-radius: @border-radius-lg;
      overflow: hidden;
      box-shadow: @card-shadow;

      .section-title {
        display: flex;
        align-items: center;
        font-size: @font-size-lg;
        font-weight: @font-weight-semibold;
        color: @text-color;
        margin: 0;
        padding: @spacing-md @spacing-md @spacing-sm @spacing-md;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid @border-color-light;

        .van-icon {
          margin-right: @spacing-sm;
          color: @primary-color;
          font-size: @font-size-lg;
        }
      }

      &.main-account-section {
        border: 2px solid @primary-color;
        box-shadow: 0 4px 12px fade(@primary-color, 20%);

        .section-title {
          background: linear-gradient(135deg, @primary-color 0%, #764ba2 100%);
          color: white;

          .van-icon {
            color: white;
          }
        }

        .main-account-info {
          display: flex;
          align-items: center;
          padding: @spacing-md;

          .account-avatar {
            width: 60px;
            height: 60px;
            border-radius: @border-radius-round;
            background: linear-gradient(
              135deg,
              @primary-color 0%,
              #764ba2 100%
            );
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: @spacing-md;
            box-shadow: @shadow-soft;

            .van-icon {
              color: white;
              font-size: 40px;
            }
          }

          .account-details {
            flex: 1;

            .account-name {
              font-size: @font-size-lg;
              font-weight: @font-weight-semibold;
              color: @text-color;
              margin-bottom: @spacing-xs;
            }

            .account-email {
              font-size: @font-size-sm;
              color: @text-color-secondary;
              margin-bottom: @spacing-sm;
            }

            .account-status {
              display: flex;
              align-items: center;
              gap: @spacing-sm;

              .sub-count {
                font-size: @font-size-sm;
                color: @text-color-secondary;
                font-weight: @font-weight-medium;
              }
            }
          }
        }
      }

      .empty-hint {
        text-align: center;
        padding: @spacing-lg;

        :deep(.van-empty) {
          .van-empty__image {
            width: 80px;
            height: 80px;
          }

          .van-empty__description {
            color: @text-color-secondary;
            font-size: @font-size-sm;
            margin-top: @spacing-sm;
          }
        }
      }

      .van-cell-group {
        margin: 0;
        background: transparent;
      }

      .van-cell {
        background: transparent;
        border: none;
        border-bottom: 1px solid @border-color-light;
        margin: 0;
        padding: @spacing-md;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: @background-dark;
        }

        :deep(.van-cell__left-icon) {
          margin-right: @spacing-sm;
          color: @primary-color;
        }

        :deep(.van-cell__title) {
          font-weight: @font-weight-medium;
          color: @text-color;
        }

        :deep(.van-cell__label) {
          color: @text-color-secondary;
          font-size: @font-size-sm;
        }

        :deep(.van-cell__value) {
          color: @text-color-secondary;
          font-size: @font-size-sm;
        }

        .van-button {
          margin-left: @spacing-sm;
          border-radius: @border-radius-sm;
          font-weight: @font-weight-medium;

          &.van-button--danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            border: none;

            &:hover {
              background: linear-gradient(135deg, #ff5252 0%, #e53e58 100%);
            }
          }

          &.van-button--warning {
            background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
            border: none;
            color: white;

            &:hover {
              background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            }
          }
        }
      }
    }
  }
}

.add-sub-account-popup {
  .popup-content {
    padding: @spacing-md;

    .van-field {
      background: @card-background;
      border-radius: @border-radius-sm;
      border: 1px solid @border-color-light;
      margin-bottom: @spacing-md;
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
    }

    .tip-text {
      background: @card-background;
      padding: @spacing-md;
      border-radius: @border-radius-sm;
      border: 1px solid @border-color-light;
      margin-top: @spacing-sm;

      p {
        margin: @spacing-xs 0;
        font-size: @font-size-sm;
        color: @text-color-secondary;
        line-height: @line-height-base;

        &:first-child {
          margin-top: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

/* 现代化导航栏图标样式 */
.nav-right-icons {
  display: flex;
  align-items: center;
  gap: @spacing-sm;

  .nav-icon {
    font-size: @font-size-h3;
    color: @text-color-inverse;
    cursor: pointer;
    transition: all @animation-duration-base @animation-timing-function;
    padding: @spacing-xs;
    border-radius: @border-radius-sm;

    &:hover {
      transform: scale(1.1);
      background: fade(@background-light, 20%);
    }

    &:active {
      transform: scale(0.95);
    }

    &.user-icon {
      background: fade(@background-light, 15%);
      border-radius: @border-radius-round;
    }
  }
}

/* iPad和中等屏幕优化 (768px - 1024px) */
@media (min-width: @screen-md) and (max-width: 1024px) {
  .task-board {
    .main-content {
      padding-top: 110px; /* 减少头部padding */

      .task-list {
        padding: 0 @spacing-sm (@layout-tabbar-height + @spacing-sm) @spacing-sm;

        .subject-section {
          margin-bottom: @spacing-xs;

          .subject-header {
            padding: @spacing-xs @spacing-sm;
            font-size: @font-size-lg;

            .van-icon {
              font-size: @font-size-lg;
              margin-right: @spacing-xs;
            }

            > span {
              font-size: @font-size-lg;
            }

            .van-tag {
              font-size: @font-size-xs;
              padding: 4px @spacing-xs;
            }
          }
        }
      }

      .task-stats {
        margin: 0 @spacing-sm @spacing-xs;
        padding: @spacing-sm;

        .overall-progress {
          margin-bottom: @spacing-xs / 2;

          .progress-text {
            font-size: @font-size-sm;
            margin-bottom: @spacing-xs / 2;
          }
        }

        .subjects-progress {
          padding-top: @spacing-xs / 2;

          .subjects-scroll-container {
            gap: @spacing-sm;

            .subject-circle-item {
              min-width: 60px;

              .subject-circle {
                margin-bottom: @spacing-xs / 2;
                :deep(.van-circle) {
                  font-size: @font-size-xs;
                }
              }

              .subject-name {
                font-size: @font-size-xs;
                max-width: 60px;
              }
            }
          }
        }
      }

      /* iPad空状态和加载状态优化 */
      .empty-state {
        padding: @spacing-md 0;

        :deep(.van-empty) {
          .van-empty__image {
            width: 100px;
            height: 100px;
          }

          .van-empty__description {
            font-size: @font-size-sm;
            margin-top: @spacing-sm;
          }
        }
      }

      .loading-skeleton {
        padding: @spacing-sm;

        .van-skeleton {
          margin-bottom: @spacing-sm;
        }
      }
    }
  }
}

/* 现代化响应式设计 */
@media (max-width: @screen-sm) {
  .task-board {
    /* 小屏幕固定头部优化 */
    .fixed-header {
      box-shadow: @shadow-card;

      &.scrolled {
        box-shadow: @shadow-float;
      }
    }

    /* 小屏幕主要内容区域调整 */
    .main-content {
      padding-top: 110px; /* 进一步减少小屏幕设备的padding */

      .task-list {
        padding: 0 @spacing-xs (@layout-tabbar-height + @spacing-md) @spacing-xs;

        .subject-section {
          margin-bottom: @spacing-xs;

          .subject-header {
            padding: @spacing-sm;
            font-size: @font-size-lg;

            .van-icon {
              font-size: @font-size-lg;
            }

            > span {
              font-size: @font-size-lg;
            }
          }
        }
      }

      /* 小屏幕任务统计区域优化 */
      .task-stats {
        margin: 0 @spacing-xs @spacing-xs;
        padding: @spacing-sm;

        .subjects-progress {
          .subjects-scroll-container {
            gap: @spacing-sm;

            .subject-circle-item {
              min-width: 60px;

              .subject-name {
                font-size: @font-size-xs;
                max-width: 60px;
              }
            }
          }
        }
      }

      /* 小屏幕弹窗优化 */
      .add-task-popup,
      .user-menu-popup {
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

      /* 移动端空状态和加载状态优化 */
      .empty-state {
        padding: @spacing-sm 0;

        :deep(.van-empty) {
          .van-empty__image {
            width: 80px;
            height: 80px;
          }

          .van-empty__description {
            font-size: @font-size-xs;
            margin-top: @spacing-xs;
          }
        }
      }

      .loading-skeleton {
        padding: @spacing-xs;

        .van-skeleton {
          margin-bottom: @spacing-xs;
        }
      }
    }

    /* 小屏幕导航图标优化 */
    .nav-right-icons {
      gap: @spacing-xs;

      .nav-icon {
        font-size: @font-size-lg;
        padding: @spacing-xs / 2;
      }
    }
  }
}

/* 超小屏幕优化 */
@media (max-width: @screen-xs) {
  .task-board {
    .main-content {
      padding-top: 110px; /* 超小屏幕最小padding */

      .task-list {
        .subject-section {
          .subject-header {
            font-size: @font-size-base;
            padding: @spacing-xs @spacing-sm;

            .van-icon {
              font-size: @font-size-base;
              margin-right: @spacing-xs;
            }

            > span {
              font-size: @font-size-base;
            }

            .van-tag {
              font-size: @font-size-xs;
              padding: 2px @spacing-xs;
              min-width: 20px;
            }
          }
        }
      }

      .task-stats {
        padding: @spacing-xs @spacing-sm;

        .subjects-progress {
          .subjects-scroll-container {
            .subject-circle-item {
              min-width: 50px;

              .subject-name {
                font-size: @font-size-xxs;
                max-width: 50px;
              }
            }
          }
        }
      }
    }
  }
}

/* 进度条样式优化 */
:deep(.van-progress) {
  .van-progress__pivot {
    border-radius: @border-radius-sm;
    font-weight: @font-weight-semibold;
    font-size: @font-size-sm;
    transition: all @animation-duration-base @animation-timing-function;
  }
  .van-progress__portion {
    max-width: 100%;
  }
}
</style>
