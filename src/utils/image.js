// @/utils/image.js
export function getFullImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }

  // 获取 API 基础地址，去掉末尾的 /api 或 /dev-api
  const baseApi = process.env.VUE_APP_BASE_API || 'http://localhost:8080/dev-api';
  const baseUrl = baseApi.replace(/\/(api|dev-api)\/?$/, '');
  // 如果 path 已经以 /profile/ 开头，直接拼接
  if (path.startsWith('/profile/')) {
    return baseUrl + path;
  }

  // 否则，当作子路径，自动补上 /profile/
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/profile/${cleanPath}`;
}