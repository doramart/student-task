import request from "@/request";

// 认证相关API
const authApi = {
  // 发送验证码
  async sendVerifyCode(email) {
    return await request.post("/auth/send-code", { email });
  },

  // 邮箱验证码登录
  async login(email, code) {
    return await request.post("/auth/login", { email, code });
  },

  // 获取用户信息
  async getProfile() {
    return await request.get("/auth/profile");
  },

  // 刷新token
  async refreshToken() {
    return await request.post("/auth/refresh-token");
  },

  // 退出登录
  async logout() {
    return await request.post("/auth/logout");
  },
};

export default authApi;
