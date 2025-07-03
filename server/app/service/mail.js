"use strict";

const Service = require("egg").Service;
const nodemailer = require("nodemailer");

class MailService extends Service {
  constructor(ctx) {
    super(ctx);
    this.transporter = null;
  }

  // 初始化邮件传输器
  async initTransporter() {
    console.log(
      "🚀 ~ MailService ~ initTransporter ~ this.config.mail:",
      this.config.mail
    );
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.mail.service,
        port: this.config.mail.port,
        auth: this.config.mail.auth,
      });
    }
    return this.transporter;
  }

  // 发送验证码邮件
  async sendVerifyCode(email, code) {
    try {
      const transporter = await this.initTransporter();
      const template = this.service.mailTemplate.getVerifyCodeTemplate(code);

      const mailOptions = {
        from: this.config.mail.from,
        to: email,
        subject: template.subject,
        html: template.html,
      };

      const result = await transporter.sendMail(mailOptions);

      this.logger.info(
        `验证码邮件发送成功: ${email}, messageId: ${result.messageId}`
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`验证码邮件发送失败: ${email}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 发送子账户邀请邮件
  async sendInviteEmail(email, options) {
    try {
      const transporter = await this.initTransporter();
      const template = this.service.mailTemplate.getInviteTemplate(options);

      const mailOptions = {
        from: this.config.mail.from,
        to: email,
        subject: template.subject,
        html: template.html,
      };

      const result = await transporter.sendMail(mailOptions);

      this.logger.info(
        `邀请邮件发送成功: ${email}, messageId: ${result.messageId}`
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`邀请邮件发送失败: ${email}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 验证邮件服务可用性
  async verifyConnection() {
    try {
      const transporter = await this.initTransporter();
      await transporter.verify();
      return { success: true };
    } catch (error) {
      this.logger.error("邮件服务连接失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MailService;
