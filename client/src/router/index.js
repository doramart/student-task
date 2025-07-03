import Vue from "vue";
import VueRouter from "vue-router";
import TaskBoard from "@/views/TaskBoard.vue";
import store from "@/store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    redirect: "/tasks",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: {
      title: "登录",
      requiresGuest: true, // 只有未登录用户可以访问
    },
  },
  {
    path: "/tasks",
    name: "TaskBoard",
    component: TaskBoard,
    meta: {
      title: "每日任务",
      keepAlive: true,
      requiresAuth: true, // 需要登录
    },
  },
  {
    path: "/tasks/:date",
    name: "TaskBoardWithDate",
    component: TaskBoard,
    props: true,
    meta: {
      title: "历史任务",
      keepAlive: true,
      requiresAuth: true,
    },
  },
  {
    path: "/calendar",
    name: "Calendar",
    component: () => import("@/views/Calendar.vue"),
    meta: {
      title: "任务日历",
      requiresAuth: true,
    },
  },
  {
    path: "/stats",
    name: "Statistics",
    component: () => import("@/views/Statistics.vue"),
    meta: {
      title: "学习统计",
      requiresAuth: true,
    },
  },
  {
    path: "/chatbot",
    name: "Chatbot",
    component: () => import("@/views/Chatbot.vue"),
    meta: {
      title: "AI助手",
      requiresAuth: true,
    },
  },
  {
    path: "/accept-invitation",
    name: "AcceptInvitation",
    component: () => import("@/views/AcceptInvitation.vue"),
    meta: {
      title: "接受邀请",
      requiresAuth: false,
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

// 路由守卫 - 设置页面标题和登录检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + " - 学生任务管理";
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

  // 如果应用还没有初始化，等待初始化完成
  if (!store.state.appInitialized) {
    console.log("等待应用初始化完成...");

    // 等待应用初始化完成（最多等待5秒）
    let attempts = 0;
    const maxAttempts = 50; // 5秒 = 50 * 100ms

    while (!store.state.appInitialized && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!store.state.appInitialized) {
      console.warn("应用初始化超时，继续执行路由守卫");
    }
  }

  const isLoggedIn = store.state.isLoggedIn;

  // 需要登录但未登录
  if (requiresAuth && !isLoggedIn) {
    console.log("需要登录，重定向到登录页");
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  // 只允许游客访问但已登录
  if (requiresGuest && isLoggedIn) {
    console.log("已登录，重定向到首页");
    next("/");
    return;
  }

  // 如果已登录但用户信息为空，尝试获取用户信息
  if (isLoggedIn && !store.state.user) {
    try {
      await store.dispatch("checkAuth");
    } catch (error) {
      console.error("用户状态检查失败:", error);
      // 如果用户状态检查失败且访问需要认证的页面，跳转到登录页
      if (requiresAuth) {
        next({
          path: "/login",
          query: { redirect: to.fullPath },
        });
        return;
      }
    }
  }

  next();
});

export default router;
