"use strict";

module.exports = () => {
  const config = (exports = {});

  // 开发环境日志配置
  config.logger = {
    level: "INFO",
    consoleLevel: "INFO",
  };

  // 开发环境自定义配置
  config.custom = {
    // 开发环境特定配置可以在这里添加
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

  return {
    ...config,
  };
};
