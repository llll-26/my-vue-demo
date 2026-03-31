import request from '@/utils/request'

// 获取活动详情
export function getActivityDetail(id) {
  return request({
    url: `/student/activity/${id}`,
    method: 'get'
  })
}

// 报名活动
export function enrollActivity(activityId) {
  return request({
    url: '/student/member/enroll/' + activityId,
    method: 'post'
  })
}

export function checkEnrolled(activityId) {
  return request({
    url: '/student/member/enroll/check/' + activityId,
    method: 'get'
  })
}

//完成的活动
export function getMyCompletedActivities() {
  return request({
    url: '/student/member/enroll/my/completed',
    method: 'get'
  });
}

// 获取首页轮播图
export function getBannerList() {
  return request({
    url: '/student/banner/list',
    method: 'get'
  })
}
// 取消报名
export function cancelEnrollment(activityId) {
  return request({
    url: `/student/member/enroll/cancel/${activityId}`,
    method: 'delete'
  })
}

export function checkEnrollmentStatus(activityId) {
  return request({
    url: `/activity/${activityId}/enrollment-status`,
    method: 'get'
  })
}
// 获取我的报名列表（分页）
export function getMyEnrollmentsPage(params) {
  return request({
    url: '/student/member/enroll/my/page',
    method: 'get',
    params 
  })
}
