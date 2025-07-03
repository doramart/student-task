// 科目配置统一管理
export const SUBJECTS = [
  "语文",
  "数学",
  "英语",
  "舞蹈",
  "运动",
  "阅读",
  "编程",
  "习惯养成",
  "其他",
];

// 科目颜色映射
export const SUBJECT_COLORS = {
  语文: "#ff6b6b",
  数学: "#4ecdc4",
  英语: "#45b7d1",
  舞蹈: "#ff9ff3",
  运动: "#54a0ff",
  阅读: "#5f27cd",
  编程: "#00d2d3",
  习惯养成: "#ff9f43",
  其他: "#c7ecee",
};

// 科目图标映射
export const SUBJECT_ICONS = {
  语文: "edit",
  数学: "calculator-o",
  英语: "chat-o",
  舞蹈: "music-o",
  运动: "play",
  阅读: "bookmark-o",
  编程: "desktop-o",
  习惯养成: "clock-o",
  其他: "bookmark",
};

// 默认颜色（用于未定义的科目）
export const DEFAULT_SUBJECT_COLOR = "#1989fa";

// 默认图标（用于未定义的科目）
export const DEFAULT_SUBJECT_ICON = "bookmark-o";

/**
 * 获取科目颜色
 * @param {string} subject - 科目名称
 * @returns {string} 科目对应的颜色值
 */
export function getSubjectColor(subject) {
  return SUBJECT_COLORS[subject] || DEFAULT_SUBJECT_COLOR;
}

/**
 * 获取科目图标
 * @param {string} subject - 科目名称
 * @returns {string} 科目对应的图标名称
 */
export function getSubjectIcon(subject) {
  return SUBJECT_ICONS[subject] || DEFAULT_SUBJECT_ICON;
}

/**
 * 检查科目是否存在
 * @param {string} subject - 科目名称
 * @returns {boolean} 科目是否存在
 */
export function isValidSubject(subject) {
  return SUBJECTS.includes(subject);
}

/**
 * 获取科目的完整配置信息
 * @param {string} subject - 科目名称
 * @returns {object} 科目配置对象
 */
export function getSubjectConfig(subject) {
  return {
    name: subject,
    color: getSubjectColor(subject),
    icon: getSubjectIcon(subject),
    isValid: isValidSubject(subject),
  };
}

export default {
  SUBJECTS,
  SUBJECT_COLORS,
  SUBJECT_ICONS,
  DEFAULT_SUBJECT_COLOR,
  DEFAULT_SUBJECT_ICON,
  getSubjectColor,
  getSubjectIcon,
  isValidSubject,
  getSubjectConfig,
};
