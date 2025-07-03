// 科目相关的全局 mixin
import {
  getSubjectColor,
  getSubjectIcon,
  getSubjectConfig,
  isValidSubject,
  SUBJECTS,
  SUBJECT_COLORS,
  SUBJECT_ICONS,
} from "@/config/subjects";

export default {
  methods: {
    // 获取科目颜色
    getSubjectColor,

    // 获取科目图标
    getSubjectIcon,

    // 获取科目完整配置
    getSubjectConfig,

    // 验证科目是否有效
    isValidSubject,

    /**
     * 格式化科目显示名称
     * @param {string} subject - 科目名称
     * @returns {string} 格式化后的科目名称
     */
    formatSubjectName(subject) {
      return subject || "未分类";
    },

    /**
     * 获取科目样式对象
     * @param {string} subject - 科目名称
     * @returns {object} 包含颜色和背景色的样式对象
     */
    getSubjectStyle(subject) {
      const color = getSubjectColor(subject);
      return {
        color: color,
        backgroundColor: color + "20", // 20% 透明度
        borderColor: color,
      };
    },

    /**
     * 获取科目标签样式
     * @param {string} subject - 科目名称
     * @returns {object} 标签样式对象
     */
    getSubjectTagStyle(subject) {
      const color = getSubjectColor(subject);
      return {
        color: color,
        backgroundColor: color + "15", // 15% 透明度
        border: `1px solid ${color}40`, // 40% 透明度边框
      };
    },
  },

  computed: {
    // 科目列表
    allSubjects() {
      return SUBJECTS;
    },

    // 科目颜色映射
    subjectColorMap() {
      return SUBJECT_COLORS;
    },

    // 科目图标映射
    subjectIconMap() {
      return SUBJECT_ICONS;
    },
  },
};
