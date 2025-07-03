const { defineConfig } = require("@vue/cli-service");
const { GenerateSW } = require("workbox-webpack-plugin");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,

  // 环境变量配置
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",

  // 输出目录配置 - 输出到服务端静态目录
  outputDir: path.resolve(__dirname, "../server/app/public"),

  // 禁用ESLint（解决编译错误）
  lintOnSave: false,

  // PWA 配置
  pwa: {
    name: "学生任务管理系统",
    themeColor: "#6B4EEB",
    msTileColor: "#6B4EEB",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "default",
    manifestOptions: {
      background_color: "#F0F2F5",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      lang: "zh-CN",
    },
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "public/sw.js",
      swDest: "sw.js",
    },
  },

  devServer: {
    port: 8080,
    host: "0.0.0.0",
    open: true,

    // 代理配置（仅开发环境生效，作为备用方案）
    proxy: {
      "/api": {
        target: process.env.VUE_APP_API_BASE_URL || "http://127.0.0.1:7801",
        changeOrigin: true,
        secure: false, // 如果是https，需要设置为true
        pathRewrite: {
          "^/api": "/api",
        },
        logLevel: "debug", // 开启代理日志
        onProxyReq: (proxyReq, req, res) => {
          console.log("代理请求:", req.method, req.url, "-> ", proxyReq.path);
        },
        onError: (err, req, res) => {
          console.error("代理错误:", err.message);
        },
      },
    },
  },

  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
          plugins: [
            require("postcss-pxtorem")({
              rootValue: 37.5, // Vant 官方推荐的根字体大小
              propList: ["*"],
              selectorBlackList: [".no-rem"], // 不转换的类名
              minPixelValue: 2, // 最小转换像素值
            }),
          ],
        },
      },
      // 添加 Less 预处理器配置
      less: {
        lessOptions: {
          modifyVars: {
            // 可以在这里定义全局 Less 变量
            // 例如：'primary-color': '#1890ff',
          },
          javascriptEnabled: true,
        },
        // 全局导入 Less 变量文件
        additionalData: `@import "@/assets/styles/variables.less";`,
      },
    },
    // 生产环境 CSS 配置
    ...(process.env.NODE_ENV === "production" && {
      extract: {
        // CSS文件添加hash
        filename: "css/[name].[contenthash:8].css",
        chunkFilename: "css/[name].[contenthash:8].css",
      },
      sourceMap: false,
    }),
  },

  // 链式配置 webpack
  chainWebpack: (config) => {
    // 基础配置
    config.resolve.alias.set("@", require("path").resolve(__dirname, "src"));

    // 生产环境配置
    if (process.env.NODE_ENV === "production") {
      // 配置输出文件名的 hash
      config.output
        .filename("js/[name].[contenthash:8].js")
        .chunkFilename("js/[name].[contenthash:8].js");

      // 配置代码分片
      config.optimization.splitChunks({
        chunks: "all",
        cacheGroups: {
          // 第三方库单独打包
          vendor: {
            name: "chunk-vendors",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial",
          },
          // 公共模块打包
          common: {
            name: "chunk-common",
            minChunks: 2,
            priority: 5,
            chunks: "initial",
            reuseExistingChunk: true,
          },
          // Vue相关库单独打包
          vue: {
            name: "chunk-vue",
            test: /[\\/]node_modules[\\/](vue|vue-router|vuex)[\\/]/,
            priority: 20,
            chunks: "all",
          },
          // UI组件库单独打包
          ui: {
            name: "chunk-ui",
            test: /[\\/]node_modules[\\/](vant|element-ui|ant-design-vue)[\\/]/,
            priority: 15,
            chunks: "all",
          },
        },
      });

      // 运行时代码单独提取
      config.optimization.runtimeChunk({
        name: "runtime",
      });
    }
  },

  // 构建配置
  configureWebpack: (config) => {
    const plugins = [];

    // 生产环境额外配置
    if (process.env.NODE_ENV === "production") {
      // 确保输出目录正确
      config.output = {
        ...config.output,
        path: path.resolve(__dirname, "../server/app/public"),
      };

      // 注释掉 Workbox GenerateSW 插件，因为已经使用 InjectManifest 模式
      // 避免冲突，所有缓存策略在 sw.js 中配置
    }

    config.plugins = (config.plugins || []).concat(plugins);
  },

  // 生产环境优化
  ...(process.env.NODE_ENV === "production" && {
    productionSourceMap: false, // 关闭生产环境source map
  }),
});
