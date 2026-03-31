<template>
  <div class="chat-list-page">
    <div class="header">
      <h2>消息</h2>
      <el-badge :value="totalUnread" :hidden="totalUnread === 0" class="unread-badge">
        <i class="el-icon-message"></i>
      </el-badge>
    </div>

    <div class="session-list">
      <div
        v-for="session in sessions"
        :key="session.sessionId"
        class="session-item"
        @click="openChat(session)"
      >
        <el-avatar :size="50" class="avatar">
          {{ getUsername(session).charAt(0) }}
        </el-avatar>
        <div class="session-info">
          <div class="session-header">
            <span class="username">{{ getUsername(session) }}</span>
            <span class="time">{{ formatTime(session.lastMessageTime) }}</span>
          </div>
          <div class="session-content">
            <span class="last-message">{{ session.lastMessageContent || '暂无消息' }}</span>
            <el-badge
              v-if="getUnreadCount(session) > 0"
              :value="getUnreadCount(session)"
              class="unread-count"
            />
          </div>
        </div>
      </div>

      <el-empty v-if="sessions.length === 0" description="暂无会话" />
    </div>
  </div>
</template>

<script>
import { listSessions, getUnreadCount } from '@/api/chat'
import wsClient from '@/utils/websocket'

export default {
  name: 'ChatList',
  data() {
    return {
      sessions: [],
      totalUnread: 0,
      currentUserId: null
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
    
    if (!this.currentUserId) {
      console.error('无法获取当前用户ID')
      this.$message.error('用户信息丢失，请重新登录')
    }
    
    this.loadSessions()
    this.loadUnreadCount()
    this.connectWebSocket()
  },
  beforeDestroy() {
    wsClient.offMessage(this.handleWebSocketMessage)
  },
  methods: {
    // 加载会话列表
    loadSessions() {
      listSessions().then(response => {
        this.sessions = response.rows || []
      }).catch(err => {
        console.error('加载会话列表失败:', err)
      })
    },

    // 加载未读消息数
    loadUnreadCount() {
      getUnreadCount().then(response => {
        this.totalUnread = response.data || 0
      }).catch(err => {
        console.error('加载未读消息数失败:', err)
      })
    },

    // 连接 WebSocket
    connectWebSocket() {
      if (!wsClient.isConnected()) {
        wsClient.connect()
      }
      wsClient.onMessage(this.handleWebSocketMessage)
    },

    // 处理 WebSocket 消息
    handleWebSocketMessage(type, data) {
      if (type === 'message' && data.type === 'chat') {
        // 收到新消息，刷新会话列表
        this.loadSessions()
        this.loadUnreadCount()
      }
    },

    // 打开聊天
    openChat(session) {
      const receiverId = this.getReceiverId(session)
      
      if (receiverId === this.currentUserId) {
        this.$message.error('会话数据异常，无法打开')
        console.error('receiverId 等于 currentUserId，会话数据异常')
        return
      }
      
      this.$router.push({
        path: '/chat',
        query: {
          userId: receiverId,
          sessionId: session.sessionId
        }
      })
    },

    // 获取用户名
    getUsername(session) {
      if (session.userId1 === this.currentUserId) {
        return session.user2Name || '未知用户'
      } else {
        return session.user1Name || '未知用户'
      }
    },

    // 获取接收者ID
    getReceiverId(session) {
      if (session.userId1 === this.currentUserId) {
        return session.userId2
      } else {
        return session.userId1
      }
    },

    // 获取未读数
    getUnreadCount(session) {
      if (session.userId1 === this.currentUserId) {
        return session.user1UnreadCount || 0
      } else {
        return session.user2UnreadCount || 0
      }
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'

      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.chat-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px; /* 为底部 TabBar 留出更多空间 */
}

.header {
  background: #fff;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.session-list {
  background: #fff;
  padding-bottom: 20px; /* 列表底部额外留白 */
}

.session-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.session-item:active {
  background: #f5f5f5;
}

.avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.session-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.session-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.session-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-count {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
  }
  
  .header h2 {
    font-size: 16px;
  }
  
  .session-item {
    padding: 10px 12px;
  }
}
</style>

