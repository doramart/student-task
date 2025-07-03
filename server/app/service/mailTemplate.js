"use strict";

const Service = require("egg").Service;

class MailTemplateService extends Service {
  /**
   * 获取验证码邮件模板
   * @param {string} code - 验证码
   * @returns {object} 邮件模板对象
   */
  getVerifyCodeTemplate(code) {
    return {
      subject: "【学生任务管理】邮箱验证码",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">学生任务管理系统</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">邮箱验证码</h2>
            
            <p style="font-size: 16px; margin: 20px 0;">
              您好！您正在登录学生任务管理系统。
            </p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              请使用以下验证码完成验证：
            </p>
            
            <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e8f4ff 100%); 
                        padding: 25px; text-align: center; margin: 30px 0; 
                        border-radius: 10px; border: 2px solid #667eea;">
              <span style="font-size: 36px; font-weight: bold; color: #667eea; 
                           letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </span>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; 
                        margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>重要提示：</strong><br>
                • 验证码有效期为 <strong>5分钟</strong>，请及时使用<br>
                • 请勿将验证码告知他人<br>
                • 如果这不是您的操作，请忽略此邮件
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 12px 24px; border-radius: 20px; font-size: 14px;">
                ✓ 安全验证 • 自动发送
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            此邮件由任务管理系统自动发送，请勿回复。
          </div>
        </div>
      `,
    };
  }

  /**
   * 获取子账户邀请邮件模板
   * @param {object} options - 邀请选项
   * @param {string} options.inviterName - 邀请者姓名
   * @param {string} options.inviteLink - 邀请链接
   * @param {string} options.expiresIn - 过期时间描述
   * @returns {object} 邮件模板对象
   */
  getInviteTemplate(options) {
    const { inviterName, inviteLink, expiresIn } = options;

    return {
      subject: `${inviterName} 邀请您成为任务管理系统的子账户`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">任务管理系统邀请</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">您收到了一份邀请！</h2>
            
            <p style="font-size: 16px; margin: 20px 0;">
              <strong>${inviterName}</strong> 邀请您成为任务管理系统的子账户。
            </p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              作为子账户，您将享有与主账户相同的权限，包括：
            </p>
            
            <ul style="color: #666; font-size: 14px; padding-left: 20px;">
              <li>查看和管理所有共享任务</li>
              <li>创建和编辑任务</li>
              <li>查看统计数据和日历</li>
              <li>与主账户同步任务进度</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                接受邀请
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; 
                        margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>重要提示：</strong><br>
                • 此邀请链接将在 <strong>${expiresIn}</strong> 后过期<br>
                • 如果您不认识邀请人，请忽略此邮件<br>
                • 接受邀请后，您的账户将与邀请人的账户关联
              </p>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              如果您无法点击按钮，请复制以下链接到浏览器中打开：<br>
              <span style="word-break: break-all; background: #f5f5f5; padding: 5px; border-radius: 3px;">${inviteLink}</span>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            此邮件由任务管理系统自动发送，请勿回复。
          </div>
        </div>
      `,
    };
  }

  /**
   * 获取密码重置邮件模板
   * @param {object} options - 重置选项
   * @param {string} options.userName - 用户名
   * @param {string} options.resetLink - 重置链接
   * @param {string} options.expiresIn - 过期时间描述
   * @returns {object} 邮件模板对象
   */
  getPasswordResetTemplate(options) {
    const { userName, resetLink, expiresIn } = options;

    return {
      subject: "【学生任务管理】密码重置请求",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">密码重置</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">密码重置请求</h2>
            
            <p style="font-size: 16px; margin: 20px 0;">
              您好 <strong>${userName || "用户"}</strong>！
            </p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              我们收到了您的密码重置请求。点击下方按钮即可重置您的密码：
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                重置密码
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; 
                        margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>安全提示：</strong><br>
                • 重置链接将在 <strong>${expiresIn}</strong> 后过期<br>
                • 如果这不是您的操作，请立即联系管理员<br>
                • 为了账户安全，请设置强密码
              </p>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              如果您无法点击按钮，请复制以下链接到浏览器中打开：<br>
              <span style="word-break: break-all; background: #f5f5f5; padding: 5px; border-radius: 3px;">${resetLink}</span>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            此邮件由任务管理系统自动发送，请勿回复。
          </div>
        </div>
      `,
    };
  }

  /**
   * 获取系统通知邮件模板
   * @param {object} options - 通知选项
   * @param {string} options.title - 通知标题
   * @param {string} options.content - 通知内容
   * @param {string} options.type - 通知类型 (info|success|warning|error)
   * @param {string} options.actionLink - 操作链接（可选）
   * @param {string} options.actionText - 操作按钮文字（可选）
   * @returns {object} 邮件模板对象
   */
  getNotificationTemplate(options) {
    const { title, content, type = "info", actionLink, actionText } = options;

    const typeConfig = {
      info: {
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderColor: "#667eea",
        bgColor: "#f8f9fa",
      },
      success: {
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderColor: "#667eea",
        bgColor: "#f8f9fa",
      },
      warning: {
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderColor: "#667eea",
        bgColor: "#f8f9fa",
      },
      error: {
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderColor: "#667eea",
        bgColor: "#f8f9fa",
      },
    };

    const config = typeConfig[type];

    return {
      subject: `【学生任务管理】${title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: ${
            config.gradient
          }; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: ${
              config.bgColor
            }; padding: 20px; border-radius: 8px; 
                        margin: 20px 0; border-left: 4px solid ${
                          config.borderColor
                        };">
              <div style="color: #333; font-size: 14px; white-space: pre-line;">${content}</div>
            </div>
            
            ${
              actionLink && actionText
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" 
                 style="display: inline-block; background: ${config.gradient}; 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                ${actionText}
              </a>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            此邮件由任务管理系统自动发送，请勿回复。
          </div>
        </div>
      `,
    };
  }
}

module.exports = MailTemplateService;
