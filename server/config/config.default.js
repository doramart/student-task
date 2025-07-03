"use strict";

const path = require("path");

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = process.env.APP_KEYS || appInfo.name + "_1694000000000_1000";

  // 服务器端口配置
  config.cluster = {
    listen: {
      port: 7801,
      hostname: "0.0.0.0",
    },
  };

  // 生产环境端口配置
  if (process.env.NODE_ENV === "production") {
    config.cluster = {
      listen: {
        port: 7801,
        hostname: "0.0.0.0",
      },
    };
  }

  // add your middleware config here
  config.middleware = ["auth", "errorHandler"];

  // 静态文件配置
  config.static = {
    prefix: "/", // 静态资源访问前缀
    dir: path.join(appInfo.baseDir, "app/public"), // 静态资源目录
    dynamic: true, // 如果当前访问的静态资源没有缓存，则动态生成
    preload: false,
    maxAge: 31536000, // 静态资源缓存时间（秒）
    buffer: true,
    gzip: true,
  };

  // 错误处理中间件配置
  config.errorHandler = {
    // 错误处理中间件的配置选项
  };

  // 身份验证中间件配置
  config.auth = {
    // 不使用 ignore 或 match，让中间件对所有请求生效
    // 在中间件内部处理忽略逻辑
  };

  // 安全配置
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
    ],
  };

  // CORS跨域配置
  config.cors = {
    origin: (ctx) => {
      // 动态返回origin，避免重复值问题
      const allowedOrigins = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

      const requestOrigin = ctx.get("Origin");
      if (allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }

      // 默认返回第一个允许的origin
      return "http://localhost:8080";
    },
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS",
    allowHeaders:
      "Content-Type,Authorization,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,X-Requested-With",
    credentials: true,
    maxAge: 86400, // 24小时
  };

  // MongoDB配置
  config.mongoose = {
    client: {
      url:
        process.env.MONGODB_URL || "mongodb://localhost:27017/student_task_db",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
  };

  // 参数验证配置
  config.validate = {
    convert: true,
    widelyUndefined: true,
  };

  // Session 配置
  config.session = {
    key: "EGG_SESS",
    maxAge: 7 * 24 * 3600 * 1000, // 7天
    httpOnly: true,
    encrypt: true,
    signed: true,
    renew: true, // 自动续期
  };

  // Cookie 配置
  config.cookies = {
    signed: true,
    httpOnly: true,
    secure: false, // 开发环境设为false，生产环境应设为true
    sameSite: "lax",
    maxAge: 7 * 24 * 3600 * 1000, // 7天
  };

  // 邮件服务配置
  config.mail = {
    service: process.env.MAIL_SERVICE || "smtp.qq.com", // 使用QQ邮箱服务
    port: parseInt(process.env.MAIL_PORT) || 465,
    auth: {
      user: process.env.MAIL_USER || "", // 发送邮件的邮箱
      pass: process.env.MAIL_PASS || "", // 邮箱授权码
    },
    from:
      process.env.MAIL_FROM ||
      `学生任务管理系统 <${process.env.MAIL_USER || "noreply@example.com"}>`, // 发件人信息
    // 注意：邮件模板已迁移到 app/service/mailTemplate.js 统一管理
  };

  // 验证码配置
  config.verifyCode = {
    length: 6, // 验证码长度
    expireTime: 5 * 60 * 1000, // 5分钟过期
    sendInterval: 60 * 1000, // 发送间隔1分钟
    maxTries: 5, // 最大尝试次数
  };

  // JWT配置
  config.jwt = {
    secret: process.env.JWT_SECRET || "development-jwt-secret-key", // JWT密钥，生产环境必须使用环境变量
    expiresIn: process.env.JWT_EXPIRES_IN || "7d", // token有效期，7天
    issuer: process.env.JWT_ISSUER || "student-task-system", // 签发者
    algorithm: "HS256", // 加密算法
  };

  // 自定义配置
  config.custom = {
    // 分页默认配置
    pagination: {
      defaultPage: 1,
      defaultPageSize: 10,
      maxPageSize: 100,
    },
    // 任务管理配置
    task: {
      subjects: [
        "语文",
        "数学",
        "英语",
        "舞蹈",
        "运动",
        "阅读",
        "编程",
        "习惯养成",
        "其他",
      ],
      defaultUserId: "6507f1f77778b7a6bb6e1234", // 默认用户ID，实际项目中应该从认证中获取
    },
  };

  // HTTP请求配置
  config.httpRequest = {
    timeout: 10000,
    headers: {
      "User-Agent": "EggJS-RESTful-Scaffold/1.0.0",
    },
    baseUrl: {
      doracms: "http://127.0.0.1:8080",
    },
  };

  return {
    ...config,
  };
};
