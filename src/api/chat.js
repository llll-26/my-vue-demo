import request from '@/utils/request'

// 查询会话列表
export function listSessions(query) {
  return request({
    url: '/chat/sessions',
    method: 'get',
    params: query
  })
}

// 获取会话详情
export function getSession(sessionId) {
  return request({
    url: '/chat/session/' + sessionId,
    method: 'get'
  })
}

// 获取或创建会话
export function getOrCreateSession(data) {
  return request({
    url: '/chat/session/getOrCreate',
    method: 'post',
    data: data
  })
}

// 查询消息列表
export function listMessages(sessionId, query) {
  return request({
    url: '/chat/messages/' + sessionId,
    method: 'get',
    params: query
  })
}

// 标记消息为已读
export function markAsRead(data) {
  return request({
    url: '/chat/messages/read',
    method: 'post',
    data: data
  })
}

// 查询未读消息总数
export function getUnreadCount() {
  return request({
    url: '/chat/unread/count',
    method: 'get'
  })
}

// 删除会话
export function delSession(sessionIds) {
  return request({
    url: '/chat/session/' + sessionIds,
    method: 'delete'
  })
}

