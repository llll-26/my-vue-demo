<template>
  <div class="chat-page">
    <!-- 头部 -->
    <div class="chat-header">
      <i class="el-icon-arrow-left back-btn" @click="goBack"></i>
      <span class="chat-title">{{ chatUsername }}</span>
      <i class="el-icon-more more-btn"></i>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageList">
      <div
        v-for="message in messages"
        :key="message.messageId"
        :class="['message-item', message.senderId === currentUserId ? 'sent' : 'received']"
      >
        <el-avatar :size="36" class="avatar">
          {{ getAvatarText(message) }}
        </el-avatar>
        <div class="message-content">
          <div class="message-info">
            <span class="sender-name">{{ message.senderName }}</span>
            <span class="send-time">{{ formatTime(message.sendTime) }}</span>
          </div>
          <div class="message-bubble">
            <!-- 文本消息 -->
            <div v-if="message.messageType === 'text'" class="message-text">
              {{ message.content }}
            </div>
            <!-- 图片消息 -->
            <div v-else-if="message.messageType === 'image'" class="message-image">
              <img :src="formatImageUrl(message.content)" @click="previewImage(message.content)" />
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="messages.length === 0" description="暂无消息，开始聊天吧" />
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-toolbar">
        <el-upload
          :action="uploadUrl"
          :headers="uploadHeaders"
          :show-file-list="false"
          :on-success="handleImageUpload"
          :before-upload="beforeImageUpload"
          accept="image/*"
        >
          <i class="el-icon-picture-outline toolbar-icon"></i>
        </el-upload>
      </div>
      <div class="input-box">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="2"
          placeholder="输入消息..."
          @keydown.enter.exact.prevent="sendMessage"
        />
        <el-button
          type="primary"
          size="small"
          class="send-btn"
          @click="sendMessage"
          :disabled="!inputMessage.trim()"
        >
          发送
        </el-button>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog :visible.sync="showImageViewer" width="90%">
      <img :src="currentPreviewImage" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script>
import { getOrCreateSession, listMessages, markAsRead } from '@/api/chat'
import wsClient from '@/utils/websocket'

export default {
  name: 'Chat',
  data() {
    return {
      sessionId: null,
      receiverId: null,
      chatUsername: '',
      messages: [],
      inputMessage: '',
      currentUserId: null,
      uploadUrl: process.env.VUE_APP_BASE_API + '/common/upload',
      uploadHeaders: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      showImageViewer: false,
      currentPreviewImage: ''
    }
  },
  mounted() {
    // 从 localStorage 获取用户信息
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        // 兼容 userId 和 id 两种字段
        this.currentUserId = user.userId || user.id
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
    
    this.receiverId = this.$route.query.userId
    this.sessionId = this.$route.query.sessionId

    if (!this.receiverId) {
      this.$message.error('缺少用户信息')
      this.$router.back()
      return
    }

    this.chatUsername = '用户' + this.receiverId
    this.initChat()
    this.connectWebSocket()
  },
  beforeDestroy() {
    wsClient.offMessage(this.handleWebSocketMessage)
  },
  methods: {
    // 初始化聊天
    async initChat() {
      try {
        console.log('初始化聊天: receiverId=', this.receiverId)
        
        // 获取或创建会话
        const sessionRes = await getOrCreateSession({
          userId1: this.receiverId
        })
        console.log('会话响应:', sessionRes)
        
        this.sessionId = sessionRes.data.sessionId
        console.log('会话ID:', this.sessionId)
        
        // 获取对方的用户名
        const session = sessionRes.data
        if (session.userId1 === this.currentUserId) {
          this.chatUsername = session.user2Name || '未知用户'
        } else {
          this.chatUsername = session.user1Name || '未知用户'
        }

        // 加载消息列表
        await this.loadMessages()

        // 标记为已读
        this.markAsRead()
      } catch (err) {
        console.error('初始化聊天失败:', err)
        this.$message.error('加载聊天失败')
      }
    },

    // 加载消息列表
    async loadMessages() {
      if (!this.sessionId) {
        console.warn('sessionId 为空，无法加载消息')
        return
      }

      try {
        console.log('加载消息列表: sessionId=', this.sessionId)
        const res = await listMessages(this.sessionId)
        console.log('消息列表响应:', res)
        
        this.messages = res.rows || []
        console.log('消息数量:', this.messages.length)
        
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      } catch (err) {
        console.error('加载消息失败:', err)
      }
    },

    // 标记为已读
    markAsRead() {
      if (!this.sessionId) {
        console.warn('sessionId 为空，无法标记已读')
        return
      }

      console.log('标记消息为已读: sessionId=', this.sessionId)
      
      markAsRead({ sessionId: this.sessionId }).then(() => {
        console.log('标记已读成功')
        
        // 只有在 WebSocket 已连接时才发送已读消息
        if (wsClient.isConnected()) {
          wsClient.sendReadMessage(this.sessionId)
        } else {
          console.log('WebSocket 未连接，跳过发送已读消息')
        }
      }).catch(err => {
        console.error('标记已读失败:', err)
      })
    },

    // 连接 WebSocket
    connectWebSocket() {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token 不存在，无法建立 WebSocket 连接')
        return
      }

      console.log('当前 WebSocket 状态:', wsClient.isConnected())

      if (!wsClient.isConnected()) {
        console.log('开始连接 WebSocket')
        wsClient.connect()
        
        // 等待连接建立，最多等待 5 秒
        let attempts = 0
        const checkConnection = setInterval(() => {
          attempts++
          console.log(`检查连接状态 (${attempts}/10):`, wsClient.isConnected())
          
          if (wsClient.isConnected()) {
            console.log('WebSocket 连接已建立')
            clearInterval(checkConnection)
          } else if (attempts >= 10) {
            console.error('WebSocket 连接超时')
            clearInterval(checkConnection)
          }
        }, 500)
      } else {
        console.log('WebSocket 已连接')
      }
      
      wsClient.onMessage(this.handleWebSocketMessage)
    },

    // 处理 WebSocket 消息
    handleWebSocketMessage(type, data) {
      if (type === 'message' && data.type === 'chat') {
        // 收到新消息
        if (data.sessionId === this.sessionId) {
          this.messages.push(data)
          this.$nextTick(() => {
            this.scrollToBottom()
          })

          // 如果是接收的消息，标记为已读
          if (data.receiverId === this.currentUserId) {
            this.markAsRead()
          }
        }
      }
    },

    // 发送消息
    sendMessage() {
      if (!this.inputMessage.trim()) {
        return
      }

      console.log('准备发送消息:', {
        receiverId: this.receiverId,
        content: this.inputMessage,
        isConnected: wsClient.isConnected()
      })

      // 检查 WebSocket 连接状态
      if (!wsClient.isConnected()) {
        console.warn('WebSocket 未连接，尝试重新连接')
        this.$message.warning('正在连接，请稍候...')
        
        // 尝试重新连接
        const wasConnecting = wsClient.ws && wsClient.ws.readyState === WebSocket.CONNECTING
        
        if (!wasConnecting) {
          wsClient.connect()
        }
        
        // 等待连接建立后重试
        let attempts = 0
        const checkAndSend = setInterval(() => {
          attempts++
          console.log(`等待连接 (${attempts}/10):`, wsClient.isConnected())
          
          if (wsClient.isConnected()) {
            console.log('连接成功，发送消息')
            clearInterval(checkAndSend)
            this.doSendMessage()
          } else if (attempts >= 10) {
            console.error('连接超时')
            clearInterval(checkAndSend)
            this.$message.error('连接失败，请检查网络')
          }
        }, 500)
        
        return
      }

      this.doSendMessage()
    },

    // 实际发送消息
    doSendMessage() {
      const success = wsClient.sendChatMessage(this.receiverId, this.inputMessage, 'text')
      console.log('发送消息结果:', success)

      if (success) {
        this.inputMessage = ''
      } else {
        this.$message.error('发送失败，请检查网络连接')
      }
    },

    // 处理图片上传
    handleImageUpload(response) {
      if (response.code === 200) {
        const imageUrl = response.url
        wsClient.sendChatMessage(this.receiverId, imageUrl, 'image')
      } else {
        this.$message.error('图片上传失败')
      }
    },

    // 上传前验证
    beforeImageUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB!')
      }
      return isImage && isLt5M
    },

    // 格式化图片 URL
    formatImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http')) return url
      let clean = url.replace(/\/+/g, '/')
      if (!clean.startsWith('/')) clean = '/' + clean
      return (process.env.VUE_APP_BASE_API || '') + clean
    },

    // 预览图片
    previewImage(url) {
      this.currentPreviewImage = this.formatImageUrl(url)
      this.showImageViewer = true
    },

    // 关闭图片预览
    closeImageViewer() {
      this.showImageViewer = false
      this.currentPreviewImage = ''
    },

    // 滚动到底部
    scrollToBottom() {
      const messageList = this.$refs.messageList
      if (messageList) {
        messageList.scrollTop = messageList.scrollHeight
      }
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    },

    // 获取头像显示文本（优先级：昵称首字 > 用户名首字 > 用户ID首字）
    getAvatarText(message) {
      if (message.senderNickName && message.senderNickName.trim()) {
        return message.senderNickName.charAt(0)
      }
      if (message.senderName && message.senderName.trim()) {
        return message.senderName.charAt(0)
      }
      if (message.senderId) {
        return String(message.senderId).charAt(0)
      }
      return '?'
    },

    // 返回
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.chat-header {
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
  width: 40px;
  flex-shrink: 0;
}

.chat-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.more-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
  width: 40px;
  flex-shrink: 0;
  text-align: right;
}

.message-list {
  flex: 1;
  padding: 16px;
  padding-bottom: 140px;
  overflow-y: auto;
  background: #f5f5f5;
  -webkit-overflow-scrolling: touch;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.received {
  flex-direction: row; /* 左对齐 */
}

.message-item.sent {
  flex-direction: row-reverse; /* 右对齐 */
}

.message-item.received .message-content {
  align-items: flex-start;
}

.message-item.sent .message-content {
  align-items: flex-end;
}

.message-item.received .message-bubble {
  background: #fff;
  color: #333;
}

.message-item.sent .message-bubble {
  background: #1890ff;
  color: white;
}

.avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.message-content {
  display: flex;
  flex-direction: column;
  margin: 0 8px;
  max-width: 70%;
}

.message-info {
  display: flex;
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
}

.sender-name {
  margin-right: 8px;
}

.message-bubble {
  padding: 10px 12px;
  border-radius: 8px;
  background: #1890ff;
  color: white;
  max-width: 70%;
  min-width: 50px;
  display: inline-block;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  white-space: normal;
  line-height: 1.4;
  font-size: 14px;
}

.message-image {
  width: 100%;
  border-radius: 8px;
  overflow: hidden; /* 隐藏超出部分 */
}

.message-image img {
  width: 100%; /* 让图片撑满容器 */
  height: auto; /* 保持比例 */
  display: block; /*避免 inline 间隙 */
  border-radius: 8px;
  cursor: pointer;
}

.input-area {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 8px 12px;
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  z-index: 99;
}

.input-toolbar {
  padding: 4px 0;
}

.toolbar-icon {
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-box .el-textarea__inner {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
}
.send-btn {
  flex-shrink: 0;
  border-radius: 8px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .message-content {
    max-width: 75%;
  }
  
  .message-image img {
    max-width: 180px;
  }
  
  .input-area {
    padding: 6px 10px;
  }
}
</style>

