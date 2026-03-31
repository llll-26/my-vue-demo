import request from '@/utils/request'
// 上传文件接口
export function uploadFile(data) {
  return request({
    url: '/common/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}