import request from '@/utils/request';

// 获取我的通知列表
export function getMyNotifications(userName) {
  return request({
    url: '/student/member/notification/list',
    method: 'get',
    params: { userName } // ← 必须传
  });
}

// 标记为已读
export function markNotificationAsRead(id, isRead = 1) {
  return request({
    url: `/student/member/notification/read/${id}`,
    method: 'put',
    data: { isRead }
  });
}
// 获取未读通知数量
export function getUnreadNotificationCount() {
  return request({
    url: '/student/notification/unread-count',
    method: 'get'
  })
}