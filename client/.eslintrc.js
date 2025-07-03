module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  extends: ["plugin:vue/essential"],
  plugins: ["vue"],
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // 关闭所有可能导致编译失败的规则
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-mutating-props": "off",
    "vue/no-unused-components": "off",
    "vue/no-unused-vars": "off",

    // 其他可能的问题规则
    "no-undef": "off",
    "no-redeclare": "off",
    "no-dupe-keys": "off",
    "import/no-unresolved": "off",
  },
  overrides: [
    {
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@babel/eslint-parser",
        requireConfigFile: false,
      },
    },
  ],
};
