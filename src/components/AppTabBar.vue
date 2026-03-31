<template>
  <footer class="app-tabbar">
    <!-- 首页 -->
    <div
      class="nav-item"
      :class="{ active: $route.path === '/home' }"
      @click="$route.path !== '/home' && $router.push('/home')"
    >
      <img src="@/assets/首页.png" alt="首页" />
    </div>

    <!-- 发布 -->
    <div
      class="nav-item"
      :class="{ active: $route.path === '/publishSkill' }"
      @click="$route.path !== '/publishSkill' && $router.push('/publishSkill')"
    >
      <img src="@/assets/发布.png" alt="发布" />
    </div>

    <!-- 聊天 -->
   <!-- 聊天 -->
<div
  class="nav-item"
  :class="{ active: $route.path === '/chatList' || $route.path === '/chat' }"
  @click="goToChat"
>
  <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="chat-badge">
    <img src="@/assets/消息.png" alt="消息" class="nav-img" />
  </el-badge>
</div>

    <!-- 个人中心 -->
<div
  class="nav-item"
  :class="{ active: $route.path.startsWith('/profile') }"
  @click="$route.path !== '/profile' && $router.push('/profile')"
>
  <el-badge 
    :value="pendingAppointments" 
    :hidden="pendingAppointments === 0"
    class="profile-badge"
  >
    <img src="@/assets/个人中心.png" alt="个人中心" />
  </el-badge>
</div>

    <!-- 积分/奖品 -->
    <div
      class="nav-item"
      :class="{ active: $route.path.startsWith('/points') || $route.path === '/pointsManagement' }"
      @click="$route.path !== '/pointsManagement' && $router.push('/pointsManagement')"
    >
      <img src="@/assets/奖品.png" alt="奖品" />
    </div>
  </footer>
</template>

<script>
import { getUnreadCount } from '@/api/chat'
import wsClient from '@/utils/websocket'
import { getUnreadAppointmentCount } from '@/api/skill'
export default {
  name: 'AppTabBar',
  data() {
    return {
      unreadCount: 0,
      timer: null,
      pendingAppointments: 0 // 表示待处理的预约数
    }
  },
  mounted() {
    this.loadUnreadCount()
    this.loadPendingAppointments()
    this.connectWebSocket()
    // 定时刷新未读消息数
    this.timer = setInterval(() => {
      this.loadUnreadCount()
      this.loadPendingAppointments()
    }, 30000) // 每30秒刷新一次
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    wsClient.offMessage(this.handleWebSocketMessage)
  },
  methods: {
    async loadPendingAppointments() {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await getUnreadAppointmentCount()
    this.pendingAppointments = res.data || 0
  } catch (err) {
    console.error('加载待处理预约数失败:', err)
  }
},
    // 加载未读消息数
    loadUnreadCount() {
      const token = localStorage.getItem('token')
      if (!token) return

      getUnreadCount().then(response => {
        this.unreadCount = response.data || 0
      }).catch(err => {
        console.error('加载未读消息数失败:', err)
      })
    },

    // 连接 WebSocket
    connectWebSocket() {
      const token = localStorage.getItem('token')
      if (!token) return

      if (!wsClient.isConnected()) {
        wsClient.connect()
      }
      wsClient.onMessage(this.handleWebSocketMessage)
    },

    // 处理 WebSocket 消息
    handleWebSocketMessage(type, data) {
      if (type === 'message' && data.type === 'chat') {
        // 收到新消息，刷新未读数
        this.loadUnreadCount()
      }
    },

    // 跳转到聊天列表
    goToChat() {
      if (this.$route.path !== '/chatList') {
        this.$router.push('/chatList')
      }
    }
  }
}
</script>

<style>
.app-tabbar {
  display: flex;
  justify-content: space-around;
  background-color: #b3d9ff;
  padding: 12px 0;
  border-top: 1px solid #ccc;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  font-size: 0.85rem;
  color: #333;
}

.nav-item img {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

.chat-badge .nav-img {
  width: 24px;
  height: 24px;
}
.nav-item.active img,
.nav-item.active {
  opacity: 1;
  color: #409eff;
  font-weight: bold;
}


.nav-item:active {
  transform: scale(0.95);
}

.chat-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>