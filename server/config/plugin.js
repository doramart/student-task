"use strict";

/** @type Egg.EggPlugin */
module.exports = {
  // 启用CORS插件
  cors: {
    enable: true,
    package: "egg-cors",
  },

  // 启用参数验证插件
  validate: {
    enable: true,
    package: "egg-validate",
  },

  // MongoDB 支持
  mongoose: {
    enable: true,
    package: "egg-mongoose",
  },

  // Session 已内置在 Egg.js 中，无需重复定义
  // Cookies 已内置在 Egg.js 中，无需重复定义
};
