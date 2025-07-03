"use strict";

module.exports = () => {
  const config = (exports = {});

  // 生产环境端口配置
  config.cluster = {
    listen: {
      port: 7801,
      hostname: "0.0.0.0",
    },
  };

  // 生产环境日志配置
  config.logger = {
    dir: "/home/ubuntu/doraData/logsdir/studenttask",
    level: "INFO",
    consoleLevel: "INFO",
  };

  // 生产环境安全配置
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [], // 生产环境需要配置具体的域名白名单
  };

  // 生产环境CORS配置
  config.cors = {
    origin: [], // 生产环境需要配置具体的允许域名
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
    credentials: true,
  };

  config.httpRequest = {
    timeout: 10000,
    headers: {
      "User-Agent": "EggJS-RESTful-Scaffold/1.0.0",
    },
    baseUrl: {
      doracms: "https://www.html-js.cn",
    },
  };

  return {
    ...config,
  };
};
