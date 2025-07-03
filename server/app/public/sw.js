/* eslint-disable no-undef */

// 版本控制 - 每次发布时更新这个版本号
const VERSION = "v1.0.1";
const CACHE_NAME = `student-task-${VERSION}`;

// 需要预缓存的核心资源
const CORE_CACHE_RESOURCES = ["/", "/manifest.json", "/favicon.ico"];

// 静态资源缓存策略
const STATIC_CACHE_RESOURCES = [
  /\.(?:js|css)$/,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
];

// 不需要缓存的资源
const CACHE_BLACKLIST = [
  /sockjs-node/, // webpack dev server
  /hot-update/, // webpack hot reload
  /\.map$/, // source maps
];

// Service Worker 安装事件
self.addEventListener("install", (event) => {
  console.log(`[SW ${VERSION}] 安装中...`);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // 预缓存核心资源
        console.log(`[SW ${VERSION}] 预缓存核心资源:`, CORE_CACHE_RESOURCES);
        await cache.addAll(CORE_CACHE_RESOURCES);

        console.log(`[SW ${VERSION}] 安装完成`);

        // 立即激活新的Service Worker
        return self.skipWaiting();
      } catch (error) {
        console.error(`[SW ${VERSION}] 安装失败:`, error);
        throw error;
      }
    })()
  );
});

// Service Worker 激活事件
self.addEventListener("activate", (event) => {
  console.log(`[SW ${VERSION}] 激活中...`);

  event.waitUntil(
    (async () => {
      try {
        // 清理旧版本缓存
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(
          (name) => name.startsWith("student-task-") && name !== CACHE_NAME
        );

        if (oldCaches.length > 0) {
          console.log(`[SW ${VERSION}] 清理旧缓存:`, oldCaches);
          await Promise.all(oldCaches.map((name) => caches.delete(name)));
        }

        // 立即控制所有客户端
        await self.clients.claim();

        // 通知所有客户端 SW 已激活
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_ACTIVATED",
            version: VERSION,
          });
        });

        console.log(`[SW ${VERSION}] 激活完成`);
      } catch (error) {
        console.error(`[SW ${VERSION}] 激活失败:`, error);
        throw error;
      }
    })()
  );
});

// 请求拦截处理
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过不需要缓存的资源
  if (CACHE_BLACKLIST.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // API 请求策略：网络优先，缓存后备
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 静态资源策略：缓存优先，网络后备
  if (STATIC_CACHE_RESOURCES.some((pattern) => pattern.test(request.url))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML 文档策略：网络优先，缓存后备
  if (
    request.mode === "navigate" ||
    request.headers.get("Accept")?.includes("text/html")
  ) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 默认策略：直接网络请求
  event.respondWith(fetch(request));
});

// 网络优先策略
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // 尝试网络请求
    const networkResponse = await fetch(request);

    // 成功时缓存响应（仅缓存成功的响应）
    if (networkResponse.ok && request.method === "GET") {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(`[SW ${VERSION}] 网络请求失败，尝试缓存:`, request.url);

    // 网络失败时从缓存获取
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果是导航请求且没有缓存，返回离线页面
    if (request.mode === "navigate") {
      return (
        cache.match("/") ||
        new Response("应用离线中", {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }

    throw error;
  }
}

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  // 先尝试从缓存获取
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // 缓存未命中时网络请求
    const networkResponse = await fetch(request);

    // 缓存成功的响应
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW ${VERSION}] 资源获取失败:`, request.url, error);
    throw error;
  }
}

// 消息处理
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      console.log(`[SW ${VERSION}] 收到跳过等待指令`);
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0]?.postMessage({
        type: "VERSION_INFO",
        version: VERSION,
        cacheName: CACHE_NAME,
      });
      break;

    case "CLEAR_CACHE":
      clearAllCaches().then((result) => {
        event.ports[0]?.postMessage({
          type: "CACHE_CLEARED",
          success: result,
        });
      });
      break;

    case "CACHE_TASK":
      cacheOfflineTask(data);
      break;

    default:
      console.log(`[SW ${VERSION}] 未知消息类型:`, type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log(`[SW ${VERSION}] 所有缓存已清理`);
    return true;
  } catch (error) {
    console.error(`[SW ${VERSION}] 清理缓存失败:`, error);
    return false;
  }
}

// 后台同步事件
self.addEventListener("sync", (event) => {
  console.log(`[SW ${VERSION}] 后台同步事件:`, event.tag);

  if (event.tag === "task-sync") {
    event.waitUntil(syncTasks());
  }
});

// 同步任务数据
async function syncTasks() {
  try {
    console.log(`[SW ${VERSION}] 开始同步任务...`);

    // 这里可以实现具体的同步逻辑
    // 例如：从 IndexedDB 获取离线任务并同步到服务器

    // 通知客户端同步完成
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        data: { message: "任务同步完成" },
      });
    });

    console.log(`[SW ${VERSION}] 任务同步完成`);
  } catch (error) {
    console.error(`[SW ${VERSION}] 任务同步失败:`, error);
  }
}

// 推送通知事件
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "您有新的任务提醒",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        { action: "view", title: "查看" },
        { action: "dismiss", title: "忽略" },
      ],
      requireInteraction: true,
      tag: data.tag || "default",
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "学生任务管理系统",
        options
      )
    );
  } catch (error) {
    console.error(`[SW ${VERSION}] 推送通知处理失败:`, error);
  }
});

// 通知点击事件
self.addEventListener("notificationclick", (event) => {
  console.log(`[SW ${VERSION}] 通知点击:`, event.action);

  event.notification.close();

  if (event.action === "view") {
    const url = event.notification.data.url || "/";
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clients) => {
        // 尝试找到已打开的窗口
        for (const client of clients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // 没有找到已打开的窗口，打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// 缓存离线任务（预留接口）
async function cacheOfflineTask(task) {
  console.log(`[SW ${VERSION}] 缓存离线任务:`, task);
  // 这里可以实现 IndexedDB 存储逻辑
}

console.log(`[SW ${VERSION}] Service Worker 脚本加载完成`);
