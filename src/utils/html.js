
/**
 * 去除 HTML 标签，返回纯文本
 * @param {string} html - 含 HTML 的字符串
 * @returns {string} 纯文本
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  
  // 创建临时 div（不会插入 DOM）
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  
  // 兼容不同浏览器
  return tmp.textContent || tmp.innerText || ''
}



// parseAvailableTime函数
export function parseAvailableTime(raw) {
  if (!raw) return [];

  // 情况1: 已经是数组（理论上不会发生，因为后端返回 string）
  if (Array.isArray(raw)) {
    return raw.map(String).filter(t => t.trim());
  }

  // 情况2: 是字符串
  const str = String(raw).trim();
  if (!str) return [];

  // 尝试当作 JSON 解析
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(t => t.trim());
    } else {
      // JSON 解析成功但不是数组，比如数字、对象 → 回退到字符串
      return [str];
    }
  } catch (e) {
    // 不是合法 JSON，当作普通字符串（如 "周末"）
    return [str];
  }
}