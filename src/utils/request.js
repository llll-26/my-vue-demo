import axios from 'axios'
import { Message } from 'element-ui' 
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000,
 
})

// 请求拦截器
request.interceptors.request.use(config => {
  const url = config.url || ''

  // 公开接口（支持带前缀）
  if (url.includes('/login') || url.includes('/register') || url.includes('/captchaImage')) {
    return config
  }

  const token = localStorage.getItem('token')
  if (token && token.trim()) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

// 响应拦截器

request.interceptors.response.use(
  response => {
    // 👇 新增判断：如果响应类型是 blob 或 arraybuffer，直接返回原始响应
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response // 不走 code/msg 逻辑
    }

    const res = response.data // { code, msg, data }

    if (res.code === 200) {
      return res
    }

    if (res.code === 401) {
      localStorage.removeItem('token')
      Message.error('登录状态已失效，请重新登录')
      router.push('/login')
      return Promise.reject(new Error(res.msg || '认证失败'))
    }

    return Promise.reject(new Error(res.msg || '操作失败'))
  },
  error => {
    // 网络层错误（HTTP 非 2xx）
    console.error('网络异常:', error)
    let message = '网络错误，请稍后重试'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        message = '请重新登录'
      } else if (status === 404) {
        message = '请求资源不存在'
      } else if (status >= 500) {
        message = '服务器开小差了'
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    } else if (error.message === 'Network Error') {
      message = '网络连接失败'
    }

    // 网络错误仍需提示用户
    Message.error(message)
    return Promise.reject(error)
  }
)

export default request