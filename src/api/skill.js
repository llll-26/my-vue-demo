import request from '@/utils/request'

// 发布技能
export function publishSkill(data) {
  return request({
    url: '/skill/publish',
    method: 'post',
    data: data
  })
}

// 获取分类列表
export function getSkillCategories() {
  return request({
    url: '/skill/category/categories',
    method: 'get'
  })
}

export function getMyPublishedSkills() {
  return request({
    url: '/skill/me',
    method: 'get'
  });
}

export function updatePublishedSkill(data) {
  return request({
    url: '/skill/update',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data' //如果包含图片文件
    }
  })
}

export function getSkillList(params) {
  return request({
    url: '/skill/list',
    method: 'get',
    params
  })
}

// 获取技能详情
export function getSkillDetail(id) {
  return request({
    url: `/skill/${id}`,
    method: 'get'
  })
}
//预约技能
export function reserveSkill(data) {
  return request({
    url: '/skill-orders',
    method: 'post',
    data 
  })
}

// 我预约的（请求者）
export function getMyAppointmentsAsRequester(params) {
  return request({
    url: '/skill-orders/my-orders',
    method: 'get',
    params 
  })
}
// 别人预约我的（提供者）
export function getMyAppointmentsAsProvider(params) {
  return request({
    url: '/skill-orders/my-provided-orders',
    method: 'get',
    params
  })
}
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  })
}

// 获取订单详情
// 学习者查看我预约的订单详情
export function getMyRequestedOrderDetail(id) {
  return request({
    url: `/skill-orders/my-requested-order/${id}`,
    method: 'get'
  })
}

// 提供者查看别人预约我的订单详情
export function getMyProvidedOrderDetail(id) {
  return request({
    url: `/skill-orders/my-provided-order/${id}`,
    method: 'get'
  })
}

// 提供者同意
export function confirmOrder(orderId) {
  return request({
    url: `/skill-orders/order/${orderId}/confirm`,
    method: 'post'
  })
}

// 提供者拒绝
export function rejectOrder(orderId, reason) {
  return request({
    url: `/skill-orders/order/${orderId}/reject`,
    method: 'post',
    data: { reason }
  })
}

export function completeOrder(orderId,data) {
  return request({
    url: `/skill-orders/order/${orderId}/complete`,
    method: 'post',
    data
  });
}
/**
 * 学习者确认订单完成
 * @param {Number} orderId 订单ID
 */
export function confirmCompletion(orderId) {
  return request({
    url: `/skill-orders/order/${orderId}/confirm-completion`,
    method: 'post'
  })
}

export function getCompletedOrders(params) {
  return request({
    url: '/skill-orders/completed',
    method: 'get',
    params // { pageNum: 1, pageSize: 10 }
  })
}

export function uploadSkillCover(file) {
  const formData = new FormData()
  formData.append('file', file) // 和后端@RequestParam("file")对应
  return request({
    url: '/common/upload', // 改为使用标准上传接口
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data' // 必须加这个请求头
    },
    timeout: 30000
  })
}

export function getUnreadAppointmentCount() {
  return request({
    url: '/skill-orders/unread-count',
    method: 'get'
  })
}
// 获取“我发起的预约中，已被接受但未读的数量”
export function getConfirmedUnreadCount() {
  return request({
    url: '/skill-orders/confirmed-unread-count',
    method: 'get'
  })
}
// 标记订单为已读
export function markOrderAsRead(orderId) {
  return request({
    url: `/skill-orders/order/${orderId}/mark-read`,
    method: 'post'
  });
}
// 删除已发布技能
export function deletePublishedSkill(id) {
  return request({
    url: `/skill/${id}`,
    method: 'delete'
  })
}