import request from '@/utils/request'
// 提交评论
export function addReview(data) {
  return request({
    url: '/review/add',
    method: 'post',
    data
  })
}
// 检查当前用户是否已评论该订单
export function checkIfReviewed(orderId) {
  return request({
    url: `/review/check/${orderId}`,
    method: 'get'
  })
}