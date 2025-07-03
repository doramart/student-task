"use strict";

const dayjs = require("dayjs");

module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  // Task Schema 定义
  const TaskSchema = new Schema(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },
      title: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true,
      },
      description: {
        type: String,
        maxlength: 500,
        trim: true,
        default: "",
      },
      subject: {
        type: String,
        required: true,
        enum: [
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
        index: true,
      },
      date: {
        type: Date,
        required: true,
        index: true,
      },
      isCompleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      deadline: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      // 配置 toJSON 转换，自动格式化时间字段
      toJSON: {
        transform: function (doc, ret) {
          // 格式化时间字段为 YYYY-MM-DD HH:mm:ss
          if (ret.date) {
            ret.date = dayjs(ret.date).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.deadline) {
            ret.deadline = dayjs(ret.deadline).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.completedAt) {
            ret.completedAt = dayjs(ret.completedAt).format(
              "YYYY-MM-DD HH:mm:ss"
            );
          }
          if (ret.createdAt) {
            ret.createdAt = dayjs(ret.createdAt).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.updatedAt) {
            ret.updatedAt = dayjs(ret.updatedAt).format("YYYY-MM-DD HH:mm:ss");
          }
          return ret;
        },
      },
      // 配置 toObject 转换，同样格式化时间字段
      toObject: {
        transform: function (doc, ret) {
          // 格式化时间字段为 YYYY-MM-DD HH:mm:ss
          if (ret.date) {
            ret.date = dayjs(ret.date).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.deadline) {
            ret.deadline = dayjs(ret.deadline).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.completedAt) {
            ret.completedAt = dayjs(ret.completedAt).format(
              "YYYY-MM-DD HH:mm:ss"
            );
          }
          if (ret.createdAt) {
            ret.createdAt = dayjs(ret.createdAt).format("YYYY-MM-DD HH:mm:ss");
          }
          if (ret.updatedAt) {
            ret.updatedAt = dayjs(ret.updatedAt).format("YYYY-MM-DD HH:mm:ss");
          }
          return ret;
        },
      },
    }
  );

  // 创建复合索引优化查询
  TaskSchema.index({ userId: 1, date: 1 });
  TaskSchema.index({ userId: 1, subject: 1, date: 1 });
  TaskSchema.index({ userId: 1, isCompleted: 1, date: 1 });

  // 更新时自动设置 updatedAt
  TaskSchema.pre("findOneAndUpdate", function () {
    this.set({ updatedAt: new Date() });
  });

  TaskSchema.pre("updateOne", function () {
    this.set({ updatedAt: new Date() });
  });

  TaskSchema.pre("updateMany", function () {
    this.set({ updatedAt: new Date() });
  });

  return mongoose.model("Task", TaskSchema);
};
