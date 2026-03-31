import request from '@/utils/request'

/**
 * 获取用户积分总览和明细
 */
export function getPointsOverview() {
  return request({
    url: '/points',
    method: 'get'
  })
}
/**
 * 获取“我服务别人的已完成订单”（PointsGrowth）
 */
export function getPointsGrowthOrders() {
  return request({
    url: '/points/growth',
    method: 'get'
  })
}
/**
 * 生成单次服务证明
 * @param {Number} orderId - 订单ID
 */
export function generateServiceProof(orderId) {
  return request({
    url: '/points/proof',
    method: 'post',
    data: { orderId },
    responseType: 'blob',
    headers: { 'Content-Type': 'application/json' }
  })
}
/**
 * 获取可兑换奖品列表
 */
export function getRewardList() {
  return request({
    url: '/rewards',
    method: 'get'
  })
}

/**
 * 兑换奖品
 * @param {Number} rewardId - 奖品ID
 */
export function redeemReward(rewardId) {
  return request({
    url: '/redeem',
    method: 'post',
    data: { rewardId }
  })
}

/**
 * 获取兑换记录
 */
export function getRedeemHistory() {
  return request({
    url: '/redeem/history',
    method: 'get'
  })
}
// 获取积分排行榜 Top 10
export function getTop10Rank() {
  return request({
    url: '/rank/top10',
    method: 'get'
  })
}