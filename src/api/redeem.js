import request from '@/utils/request'
export function listAvailableItems() {
  return request({
    url: '/student/reward/items',
    method: 'get'
  })
}

// 兑换奖品
export function exchangeReward(data) {
  return request({
    url: '/student/reward/exchange',
    method: 'post',
    data: data
  })
}
//获取已兑换的奖品记录
export function getRedeemedRewards() {
  return request({
    url: '/student/reward/redeemed',
    method: 'get'
  })
}