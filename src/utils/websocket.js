class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.heartbeatInterval = 30000
    this.messageHandlers = []
    this.isManualClose = false
    
    // WebSocket 状态常量
    // 0 - CONNECTING: 正在连接
    // 1 - OPEN: 已连接
    // 2 - CLOSING: 正在关闭
    // 3 - CLOSED: 已关闭
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('Token 不存在，无法建立 WebSocket 连接')
      return false
    }

    // 如果已经在连接中或已连接，不重复连接
    if (this.ws) {
      if (this.ws.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket 正在连接中，请稍候...')
        return true
      } else if (this.ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket 已连接')
        return true
      }
    }

    // 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/chat?token=${token}`

    console.log('正在连接 WebSocket:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
      return true
    } catch (error) {
      console.error('WebSocket 连接失败:', error)
      this.reconnect()
      return false
    }
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket 连接成功')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      
      // 触发连接成功事件
      this.triggerHandlers('open', null)
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('收到消息:', data)
        
        // 触发消息处理器
        this.triggerHandlers('message', data)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      this.triggerHandlers('error', error)
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket 连接关闭:', event.code, event.reason)
      this.stopHeartbeat()
      this.triggerHandlers('close', event)
      
      // 如果不是手动关闭，则尝试重连
      if (!this.isManualClose) {
        this.reconnect()
      }
    }
  }

  /**
   * 发送消息
   */
  send(data) {
    console.log('WebSocket 发送消息:', data)
    
    if (!this.ws) {
      console.error('WebSocket 实例不存在')
      return false
    }
    
    const readyState = this.ws.readyState
    const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']
    console.log('WebSocket 状态:', readyState, `(${stateNames[readyState]})`)
    
    if (readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
      console.log('消息已发送')
      return true
    } else {
      console.error('WebSocket 未连接, readyState:', readyState, `(${stateNames[readyState]})`)
      return false
    }
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(receiverId, content, messageType = 'text') {
    console.log('发送聊天消息:', { receiverId, content, messageType })
    const result = this.send({
      type: 'chat',
      receiverId: receiverId,
      content: content,
      messageType: messageType
    })
    console.log('发送结果:', result)
    return result
  }

  /**
   * 标记消息为已读
   */
  sendReadMessage(sessionId) {
    return this.send({
      type: 'read',
      sessionId: sessionId
    })
  }

  /**
   * 发送心跳
   */
  sendHeartbeat() {
    return this.send({
      type: 'heartbeat'
    })
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 重连
   */
  reconnect() {
    // 检查是否有 Token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('Token 不存在，停止重连')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket 重连次数已达上限')
      return
    }

    this.reconnectAttempts++
    console.log(`尝试重连 WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  /**
   * 关闭连接
   */
  close() {
    this.isManualClose = true
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 添加消息处理器
   */
  onMessage(handler) {
    this.messageHandlers.push(handler)
  }

  /**
   * 移除消息处理器
   */
  offMessage(handler) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  /**
   * 触发消息处理器
   */
  triggerHandlers(type, data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(type, data)
      } catch (error) {
        console.error('消息处理器执行失败:', error)
      }
    })
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 创建单例
const wsClient = new WebSocketClient()

export default wsClient

