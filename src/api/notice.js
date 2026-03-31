import request from '@/utils/request'

export function listNotices(params) {
  return request({
    url: '/system/notice/list',
    method: 'get',
    params: {
      pageSize: 5, // 取最近5条
      pageNum: 1,
      orderByColumn: 'create_time',
      isAsc: 'desc', // 倒序排列，最新的在前
      ...params
    }
  })
}