/**
 * 风险等级配色方案
 * 与WMS图例保持一致
 * @author YG
 * @date 2025-12-04
 */

/**
 * 风险等级颜色映射
 * 1级（低风险）绿色 -> 5级（高风险）红色
 */
export const RISK_LEVEL_COLORS = {
  1: '#22c55e', // 绿色 - 低风险
  2: '#84cc16', // 浅绿色 - 较低风险
  3: '#eab308', // 黄色 - 中等风险
  4: '#f97316', // 橙色 - 较高风险
  5: '#ef4444'  // 红色 - 高风险
};

/**
 * 获取风险等级对应的颜色
 * @param {number} level - 风险等级 (1-5)
 * @param {string} defaultColor - 默认颜色
 * @returns {string} 颜色值
 */
export function getRiskLevelColor(level, defaultColor = '#409EFF') {
  return RISK_LEVEL_COLORS[level] || defaultColor;
}

/**
 * 获取所有风险等级的颜色数组
 * @returns {Array<string>} 颜色数组
 */
export function getAllRiskLevelColors() {
  return Object.values(RISK_LEVEL_COLORS);
}

/**
 * 风险等级描述
 */
export const RISK_LEVEL_LABELS = {
  1: '低风险',
  2: '较低风险',
  3: '中等风险',
  4: '较高风险',
  5: '高风险'
};

/**
 * 获取风险等级描述
 * @param {number} level - 风险等级 (1-5)
 * @returns {string} 风险等级描述
 */
export function getRiskLevelLabel(level) {
  return RISK_LEVEL_LABELS[level] || '未知';
}

/**
 * 获取风险等级完整信息
 * @param {number} level - 风险等级 (1-5)
 * @returns {Object} 包含颜色和描述的对象
 */
export function getRiskLevelInfo(level) {
  return {
    level: level,
    color: getRiskLevelColor(level),
    label: getRiskLevelLabel(level)
  };
}

export default {
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  getRiskLevelColor,
  getRiskLevelLabel,
  getRiskLevelInfo,
  getAllRiskLevelColors
};
