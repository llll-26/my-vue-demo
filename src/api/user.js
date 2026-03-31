import request from '@/utils/request'

export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

export function updateUserProfile(data) {
  return request({
   url: '/system/user/profile',  
    method: 'put',
    data: data
  })
}
// 获取收到的评分统计
export function getReceivedRatings() {
  return request({
    url: '/system/user/profile/received-ratings',
    method: 'get'
  })
}

export function uploadUserAvatar(file) {
  const formData = new FormData()
  formData.append('avatarfile', file) 

  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 修改密码
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    oldPassword,
    newPassword
  }
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: data
  })
}
// 获取指定用户的公开信息（非敏感）
export function getUserPublicInfo(userId) {
  return request({
    url: `/system/user/profile/public/${userId}`,
    method: 'get'
  })
}

// 获取指定用户收到的评分统计
export function getReceivedRatingsByUserId(userId) {
  return request({
    url: `/system/user/profile/public/rating/received/${userId}`,
    method: 'get'
  })
}