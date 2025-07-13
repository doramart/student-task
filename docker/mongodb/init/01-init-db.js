// MongoDB 初始化脚本
// 这个脚本会在 MongoDB 容器首次启动时自动执行

// 切换到目标数据库
db = db.getSiblingDB("student_task_db");

// 创建应用用户
db.createUser({
  user: "student_task_user",
  pwd: "student_task_password",
  roles: [
    {
      role: "readWrite",
      db: "student_task_db",
    },
  ],
});

// 创建集合和索引
print("开始创建集合和索引...");

// 创建用户集合
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// 创建任务集合
db.createCollection("tasks");
db.tasks.createIndex({ userId: 1, date: -1 });
db.tasks.createIndex({ userId: 1, subject: 1, date: -1 });
db.tasks.createIndex({ userId: 1, date: -1, isCompleted: 1 });
db.tasks.createIndex({ userId: 1, completedAt: -1 });
db.tasks.createIndex({ createdAt: 1 });
db.tasks.createIndex({ updatedAt: 1 });

// 插入默认数据
print("插入默认数据...");

// 插入默认用户
db.users.insertOne({
  _id: ObjectId("6507f1f77778b7a6bb6e1234"),
  email: "demo@student-task.com",
  nickname: "演示用户",
  avatar: "",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 插入示例任务
db.tasks.insertMany([
  {
    userId: ObjectId("6507f1f77778b7a6bb6e1234"),
    date: new Date(),
    subject: "语文",
    title: "阅读理解练习",
    description: "完成课本第10页的阅读理解练习题",
    isCompleted: false,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: ObjectId("6507f1f77778b7a6bb6e1234"),
    date: new Date(),
    subject: "数学",
    title: "数学计算练习",
    description: "完成数学练习册第15页的计算题",
    isCompleted: false,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: ObjectId("6507f1f77778b7a6bb6e1234"),
    date: new Date(),
    subject: "英语",
    title: "英语单词记忆",
    description: "记忆第5单元的20个新单词",
    isCompleted: true,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print("数据库初始化完成！");
print("默认用户: demo@student-task.com");
print("已创建示例任务数据");
